import { _decorator, Component, Node } from "cc";
import gc from "@sg/game-client-base";
import observer from "observer";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
const { ccclass, property } = _decorator;
const { handle } = observer;

@ccclass("MusicButton")
export class MusicButton extends ObserverComponent {
    start() {
        this.turnOffMusic();
    }

    @handle(gc.UserSettings.UserSettingHandlers, (handler) => handler.setMusicEnable(false))
    turnOffMusic() {}
}
