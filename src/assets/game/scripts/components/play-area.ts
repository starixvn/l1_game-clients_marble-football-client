import gc from "@sg/game-client-base";
import { Node, Vec3, _decorator, tween, v3 } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { GamePhase, GamePhaseConfig, TimePointShowMatchWinner } from "../features/game-phase/game-phase-definitions";
import { GamePhaseHandler } from "../features/game-phase/game-phase-handler";
import { GamePhaseStore } from "../features/game-phase/game-phase-store";
import { settings } from "../game-settings";

const { getUiOpacity } = AnimationUtils;
const { ccclass, property } = _decorator;
const { Rounds } = gc;
const { render, handle } = Observer;

type TweenKey = "zoomInOut" | "fadeInOut" | "flyDown" | "flyUp";

interface TweenConfig {
    scale?: Vec3;
    position?: Vec3;
    opacity?: number;
    positionY?: number;

    time: number;
}

interface TweenConfigs {
    in: TweenConfig;
    out: TweenConfig;
}

@ccclass("PlayArea")
export class PlayArea extends ObserverComponent {
    private isZoomOut: boolean = false;
    private isScoreBoardOut: boolean = false;

    private mainPlayAreaTargets: Array<{ target: Node; key: TweenKey }>;

    @property(Node)
    private chipContainer: Node = null;

    @property(Node)
    private betChoices: Node = null;

    @property(Node)
    private scoreBoard: Node = null;

    @property(Node)
    private chips: Node = null;

    @property(Node)
    private teamScore: Node = null;

    @property([Node])
    private disappearingNodes: Node[] = [];

    private readonly tweenConfigs: Record<TweenKey, TweenConfigs> = {
        zoomInOut: {
            in: { scale: v3(1, 1, 1), position: v3(0, -86, 0), time: 1 },
            out: { scale: v3(0.5, 0.5, 1), position: v3(0, -305, 0), time: 1.5 },
        },
        fadeInOut: {
            in: { opacity: 255, time: 0.5 },
            out: { opacity: 1, time: 1 },
        },
        flyDown: {
            in: { positionY: -285, opacity: 255, time: 1 },
            out: { positionY: -385, opacity: 0, time: 1 },
        },
        flyUp: {
            in: { positionY: 303, opacity: 255, time: 0.5 },
            out: { positionY: 630, opacity: 0, time: 0.75 },
        },
    };

    private readonly ShowWinnerAndTournament = "show-winner-and-tournament";
    private readonly ShowLiveScore = "show-live-score";
    private readonly ShowWinnerAndTournamentTimeOffset = 1;

    onLoad() {
        this.mainPlayAreaTargets = [
            { target: this.betChoices, key: "zoomInOut" },
            { target: this.chipContainer, key: "zoomInOut" },
            { target: this.chips, key: "flyDown" },
        ];

        this.disappearingNodes.forEach((node) => {
            this.mainPlayAreaTargets.push({ target: node, key: "fadeInOut" });
        });

        this.setStaticTarget(this.teamScore, this.tweenConfigs.flyUp.out);
        super.onLoad();

        this.registerPhaseMatchWinner();
        this.registerPhaseShowLiveScore();
    }

    @handle(GamePhaseHandler, (handler, config: GamePhaseConfig) => handler.registerPhase(config))
    registerPhaseMatchWinner() {
        const config: GamePhaseConfig = {
            id: this.ShowWinnerAndTournament,
            begin: TimePointShowMatchWinner + this.ShowWinnerAndTournamentTimeOffset,
            end: settings.durations.placingBet + this.ShowWinnerAndTournamentTimeOffset,
        };
        return config;
    }

    @handle(GamePhaseHandler, (handler, config: GamePhaseConfig) => handler.registerPhase(config))
    registerPhaseShowLiveScore() {
        const config: GamePhaseConfig = {
            id: this.ShowLiveScore,
            begin: settings.durations.streamingVideo + 1,
            end: 1,
        };
        return config;
    }

    @render(GamePhaseStore, (store) => store.enterPhase)
    renderEnterPhase(phase: GamePhase) {
        if (!phase) {
            return;
        }
        if (phase.id === this.ShowWinnerAndTournament) {
            if (phase.progress === 0) {
                const duration = 0.2;
                this.scheduleOnce(() => this.fadeOutBetchoiceNode(true, duration), this.ShowWinnerAndTournamentTimeOffset - duration);
            } else {
                this.fadeOutBetchoiceNode(true, 0);
            }

            return;
        }

        if (phase.id === this.ShowLiveScore) {
            if (phase.progress === 0) {
                this.playAnimForTarget(this.teamScore, this.tweenConfigs.flyUp.in);
            } else {
                this.setStaticTarget(this.teamScore, this.tweenConfigs.flyUp.in);
            }
            return;
        }
    }

    @render(GamePhaseStore, (store) => store.exitPhase)
    renderExitPhase(phase: GamePhase) {
        if (!phase) {
            return;
        }
        if (phase.id === this.ShowWinnerAndTournament) {
            const duration = 0.2;
            this.scheduleOnce(() => this.fadeOutBetchoiceNode(false, duration), this.ShowWinnerAndTournamentTimeOffset - duration);
            return;
        }
    }

    fadeOutBetchoiceNode(fadeOut: boolean, duration: number) {
        const opacity = fadeOut ? 1 : 255;
        if (duration === 0) {
            AnimationUtils.setOpacityNode(this.betChoices, opacity);
        } else {
            AnimationUtils.fadeTo(this.betChoices, duration, opacity);
        }
    }

    @render(gc.Settlements.SettlementStore, (store) => store.currentFinish, {
        fireImmediately: false,
    })
    async showPlayArea(currentFinish: gc.GameServiceMessage.Finish) {
        if (!currentFinish) {
            return;
        }
        try {
            await AnimationUtils.delayTime(settings.durations.outro);
            if (this.isZoomOut) {
                this.zoomPlayArea("in");
            }
            this.playAnimForTarget(this.teamScore, this.tweenConfigs.flyUp.out);
        } catch (e) {}
    }

    @render(Rounds.RoundTimeStore, (store) => store.roundTime)
    async setAnimAndPositionPlayArea(time: number) {
        if (time < 0) {
            return;
        }

        // At the begin of streaming
        if (time === settings.durations.introVideo) {
            this.zoomPlayArea("out");
        }

        // During streaming
        if (!this.isZoomOut && time < settings.durations.introVideo && time > 0) {
            this.setStaticPlayArea("out");
        }
    }

    @render(Rounds.RoundTimeStore, (store) => store.roundTime)
    async setScoreBoard(time: number) {
        if (time < 0) {
            return;
        }

        // At the begin of streaming
        if (time === settings.durations.introVideo) {
            this.playAnimForTarget(this.scoreBoard, this.tweenConfigs.fadeInOut.out);
            this.isScoreBoardOut = true;
        }

        // At the begin of placing bet
        if (this.isScoreBoardOut && time === settings.durations.placingBet) {
            this.playAnimForTarget(this.scoreBoard, this.tweenConfigs.fadeInOut.in);
            this.isScoreBoardOut = false;
        }

        // before placing bet
        if (!this.isScoreBoardOut && time > settings.durations.placingBet) {
            this.setStaticTarget(this.scoreBoard, this.tweenConfigs.fadeInOut.out);
            this.isScoreBoardOut = true;
        }

        // during streaming
        if (!this.isScoreBoardOut && time < settings.durations.introVideo) {
            this.setStaticTarget(this.scoreBoard, this.tweenConfigs.fadeInOut.out);
            this.isScoreBoardOut = true;
        }
    }

    private playAnimForTarget(node: Node, config: TweenConfig): Promise<void> {
        return new Promise((resolve) => {
            tween(node)
                .to(
                    config.time,
                    {
                        scale: config.scale ?? node.scale,
                        position: config.position ?? node.position,
                    },
                    { easing: "sineInOut" }
                )
                .call(() => resolve())
                .start();

            if (config.opacity !== undefined) {
                const uiOpacity = getUiOpacity(node);
                tween(uiOpacity)
                    .to(config.time, { opacity: config.opacity })
                    .call(() => resolve())
                    .start();
            }

            if (config.positionY !== undefined) {
                tween(node)
                    .to(config.time, { position: v3(node.position.x, config.positionY, node.position.z) })
                    .call(() => resolve())
                    .start();
            }
        });
    }

    private async zoomPlayArea(direction: "in" | "out"): Promise<void> {
        this.isZoomOut = direction === "out";

        await Promise.all(
            this.mainPlayAreaTargets.map(({ target, key }) => this.playAnimForTarget(target, this.tweenConfigs[key][direction]))
        );
    }

    private setStaticTarget(node: Node, config: TweenConfig) {
        node.setPosition(config.position ?? node.position);
        node.setScale(config.scale ?? node.scale);

        if (config.opacity !== undefined) {
            const uiOpacity = getUiOpacity(node);
            uiOpacity.opacity = config.opacity;
        }

        if (config.positionY !== undefined) {
            node.setPosition(v3(node.position.x, config.positionY, node.position.z));
        }
    }

    private async setStaticPlayArea(direction: "in" | "out"): Promise<void> {
        this.isZoomOut = direction === "out";

        await Promise.all(
            this.mainPlayAreaTargets.map(({ target, key }) => this.setStaticTarget(target, this.tweenConfigs[key][direction]))
        );
    }
}
