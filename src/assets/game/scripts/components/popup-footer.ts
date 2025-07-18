import gc from "@sg/game-client-base";
import { _decorator, Label, Sprite } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import observer from "observer";
import { settings } from "../game-settings";
const { ccclass, property } = _decorator;
const { RoundTimeStore } = gc.Rounds;
const { render } = observer;

@ccclass("PopupFooter")
export class PopupFooter extends ObserverComponent {
    @property
    private readonly index = 0;

    @property(Label)
    private readonly timer: Label = null;

    @render(RoundTimeStore, (store) => store.roundTime - settings.durations.placingBet)
    updateTimer(time: number) {
        this.timer.string = time.toString().padStart(2, "0");
    }

    protected onEnable(): void {
        this.renderDots();
    }

    private renderDots() {
        const dots = this.node.getChildByPath("dots");

        dots.children.forEach((child, current) => {
            const sprite = child.getComponent(Sprite);
            const isActive = current % dots.children.length === this.index;

            if (isActive) {
                sprite.spriteFrame = sprite.spriteAtlas.getSpriteFrame("dimond_dot");
            } else {
                sprite.spriteFrame = sprite.spriteAtlas.getSpriteFrame("dimond_black");
            }
        });
    }
}
