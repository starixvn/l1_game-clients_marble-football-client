import gc from "@sg/game-client-base";
import inversify from "inversify";
import mobx from "mobx";
import { settings } from "../../game-settings";

const { injectable, inject } = inversify;

@injectable()
export class VideoStreamSoundStore {
    @inject(gc.Rounds.RoundTimeStore) private readonly roundTimeStore: gc.Rounds.RoundTimeStore;
    @inject(gc.UserSettings.UserSettingStore) private readonly userSettingStore: gc.UserSettings.UserSettingStore;

    constructor() {
        mobx.makeAutoObservable(this);
    }

    get isInMatch() {
        return this.roundTimeStore.roundTime < settings.durations.introVideo && this.roundTimeStore.roundTime > 0;
    }

    get isPlayBackgroundMusic() {
        return !this.isInMatch && this.userSettingStore.musicEnable;
    }
}
