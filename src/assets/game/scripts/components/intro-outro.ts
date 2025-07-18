import { _decorator, Component, UIOpacity, tween } from "cc";

const { ccclass, property } = _decorator;

@ccclass("IntroOutro")
export class IntroOutro extends Component {
    @property(UIOpacity)
    private readonly gameBackground: UIOpacity = null;

    @property(UIOpacity)
    private readonly field: UIOpacity = null;

    private readonly maxOpacity = 255;

    set showGameBackground(value: boolean) {
        this.gameBackground.node.active = value;
    }

    set showField(value: boolean) {
        this.field.node.active = value;
    }

    playIntroAnimation(at = 0, duration = 2) {
        if (at >= duration || at < 0 || duration < 0) {
            return;
        }

        const percent = 1 - at / duration;

        this.gameBackground.opacity = this.maxOpacity * percent;

        tween(this.gameBackground)
            .to(duration - at, { opacity: 0 })
            .start();
    }

    playOutroAnimation(at = 0, duration = 2) {
        if (at >= duration || at < 0 || duration < 0) {
            return;
        }

        const percent = at / duration;

        this.gameBackground.opacity = this.maxOpacity * percent;

        tween(this.gameBackground)
            .to(duration - at, { opacity: this.maxOpacity })
            .start();
    }
}
