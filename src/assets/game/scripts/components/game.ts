import gc from "@sg/game-client-base";
import { _decorator, assetManager, ImageAsset, log, Node } from "cc";
import { ChipFlying } from "db://shared-components/game/chip-flying/scripts/components/chip-flying";
import GameComponent from "db://shared-components/game/scripts/components/game-component";
import { startGame } from "db://shared-components/shared/scripts/startup";
import { DOMBackgroundImage } from "./../../../scripts/dom-background-image";

import Observer from "observer";
import { AnimationUtils } from "../../../../extensions/shared-components/assets/shared/utils";
import "../../../resources/i18n";
import { BackgroundVideoPlayer } from "../../../scripts/background-video-player";
import { siteConfigs } from "../../../scripts/site-configs";
import { containerOptions } from "../container-options";
import { GamePhase, PhaseId, TimePointTournament } from "../features/game-phase/game-phase-definitions";
import { GamePhaseStore } from "../features/game-phase/game-phase-store";
import { settings } from "../game-settings";
import { MatchResult } from "./match-result";
import { NetworkStatus, SystemIndicator } from "./system-indcator";
import { ConnectHandler } from "../features/connection/connection-handler";

startGame(settings.name, containerOptions, siteConfigs);

const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;
const SHOW_RESULT_SOUND = "show-result";
const { sentryLogger } = gc;
@ccclass
@observer(settings.name)
export default class Game extends GameComponent {
    @property({ visible: false, override: true })
    override lblMinBet = null;

    @property({ visible: false, override: true })
    override lblMaxBet = null;

    @property(ChipFlying)
    chipFlying: ChipFlying = null;

    @property(Node)
    betResultNode: Node = null;

    @property(BackgroundVideoPlayer)
    private backgroundVideoPlayer: BackgroundVideoPlayer = null;

    @property(SystemIndicator)
    private systemIndicator: SystemIndicator = null;

    private cacheRoundId = 0;
    private isPhaseWinner = false;

    override onHideGame() {
        this.backgroundVideoPlayer.stop();
    }

    onLoad() {
        this.betResultNode.active = false;
        super.onLoad();
        this.connectGameServer();
        //this.initBackgroundImage();
    }

    @handle(ConnectHandler)
    connectGameServer() {
        console.log("connectGameServer");
    }

    @handle(gc.Rounds.RoundRunningHandlers, (handle) => handle.stopRunner())
    stopRoundTimeRunner() {}

    @render(gc.Connection.ConnectionStore, (store) => store.isConnectFailed)
    handleConnectFailed(isConnectFailed: boolean) {
        if (isConnectFailed) {
            log("Connection failed");
            this.systemIndicator.networkStatus = NetworkStatus.DISCONNECTED;
            this.scheduleOnce(() => {
                this.stopRoundTimeRunner();
                this.backgroundVideoPlayer.pause();
            }, 3);
        }
    }

    @render(GamePhaseStore, (store) => store.enterPhase)
    renderEnterPhase(phase: GamePhase) {
        if (phase?.id === PhaseId.MatchWinner) {
            this.isPhaseWinner = true;
        }
    }

    @render(gc.Rounds.RoundTimeStore, (store) => store.roundTime)
    renderRoundTime(roundTime: number) {
        if (this.isPhaseWinner && roundTime <= TimePointTournament) {
            this.isPhaseWinner = false;
        }
    }

    override renderRoundId(roundId: number) {
        this.cacheRoundId = roundId;
    }

    update() {
        const roundId = this.isPhaseWinner ? this.cacheRoundId - 1 : this.cacheRoundId;
        this.lblRoundId.string = `#${roundId}`;
    }

    initBackgroundImage() {
        const { origin, pathname } = window.location;
        const imagePath = `${origin}${pathname}splash-resources/background.webp?v=1`;

        assetManager.loadRemote<ImageAsset>(imagePath, (err, imageAsset) => {
            if (err) {
                sentryLogger.logError(`Failed to load image asset ${imagePath} with error ${err}`);
                return;
            }

            const nativeUrl = imageAsset.nativeUrl;

            DOMBackgroundImage.createBackgroundImageElement(nativeUrl);
        });
    }

    private showWinningChoice(settlementResult: any) {
        const betResults = ["away", "draw", "home"];

        betResults.forEach((betResult) => {
            this.betResultNode.getChildByPath(`result/${betResult}`).active = settlementResult[betResult];
        });
    }

    async showResult(
        result: gc.GameServiceMessage.TResult,
        hasAnimation: boolean,
        settlementResult: gc.GameServiceMessage.TSettlementResult
    ) {
        try {
            const matchResult = this.betResultNode.getComponent(MatchResult);

            if (hasAnimation) {
                await AnimationUtils.delayTime(settings.durations.outro);
                this.betResultNode.active = true;
                await matchResult.show(hasAnimation);
            } else {
                this.betResultNode.active = true;
                matchResult.show(false);
            }
        } catch (e) {}
    }

    renderCurrentFinish(currentFinish: gc.GameServiceMessage.Finish) {
        if (!currentFinish) {
            return;
        }
        const { result, settlementResult } = currentFinish;

        if (!this.isValidResult(result, settlementResult)) {
            return;
        }

        this.showResult(result, true, settlementResult).then(() => {
            this.finishShowResult(result, settlementResult);
            this.chipFlying.callActionPayChips();
        });
        this.scheduleOnce(() => {
            this.playSound(SHOW_RESULT_SOUND);
        }, 0.5);
    }

    @render(gc.Settlements.SettlementStore, (store) => ({ result: store.result, settlementResult: store.settlementResult }))
    handleResult(data: { result: gc.GameServiceMessage.TResult; settlementResult: gc.GameServiceMessage.TSettlementResult }) {
        if (this.enableFixHandleFinish) {
            return;
        }
        const { result, settlementResult } = data;

        if (!this.isValidResult(result, settlementResult)) {
            this.isReceiveFinishBeforeRoundHistory = false;
            return;
        }

        this.showResult(result, true, settlementResult).then(() => {
            this.finishShowResult(result, settlementResult);
        });
        this.playSound(gc.Audios.AudioIds.RECEIVE_FINISH);
        this.scheduleOnce(() => {
            this.playSound(SHOW_RESULT_SOUND);
        }, 0.5);
    }
}
