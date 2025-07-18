import gc from "@sg/game-client-base";
import inversify from "inversify";
import mobx from "mobx";
import { GamePhaseConfig } from "./game-phase-definitions";
import { GamePhaseStore } from "./game-phase-store";

const { injectable, inject } = inversify;

@injectable()
export class GamePhaseHandler {
    @inject(gc.Rounds.RoundTimeStore) private readonly roundTimeStore: gc.Rounds.RoundTimeStore;
    @inject(GamePhaseStore) private readonly gamePhaseStore: GamePhaseStore;

    constructor() {
        mobx.makeAutoObservable(this);

        setTimeout(() => {
            mobx.reaction(
                () => this.roundTimeStore.roundTime,
                (roundTime) => {
                    this.updateWithRoundTime(roundTime);
                }
            );
        }, 0);
    }

    private readonly configs: GamePhaseConfig[] = [];

    private cache = {};

    registerPhase(config: GamePhaseConfig) {
        this.configs.push(config);
    }

    updateWithRoundTime(roundTime: number) {
        this.configs.forEach((config) => this.checkConfig(config, roundTime));
    }

    checkConfig(config: GamePhaseConfig, roundTime: number) {
        const visible = roundTime > config.end && roundTime <= config.begin;

        if (roundTime === config.begin + 1) {
            this.gamePhaseStore.setBeforeEnterPhase({
                id: config.id,
            });
        }

        const cache = this.cache[config.id];
        const notVisibleFirst = !cache && !visible;
        if (notVisibleFirst || cache?.visible === visible) {
            return;
        }

        let progress = config.begin - roundTime;
        if (config.duration) {
            if (progress > config.duration) {
                progress = config.duration;
            }
        }

        const phase = {
            id: config.id,
            visible,
            progress,
        };

        this.cache[config.id] = phase;
        if (visible) {
            this.gamePhaseStore.setEnterPhase(phase);
        } else {
            this.gamePhaseStore.setExitPhase(phase);
        }
    }
}
