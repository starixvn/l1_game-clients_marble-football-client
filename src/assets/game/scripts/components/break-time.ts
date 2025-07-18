import { _decorator, Component, sp } from "cc";

const { ccclass, property } = _decorator;

@ccclass("BreakTime")
export class BreakTime extends Component {
    @property(sp.Skeleton)
    private readonly breakTime: sp.Skeleton = null;

    protected onLoad(): void {
        this.breakTime.node.active = false;
    }

    protected onDisable(): void {
        this.breakTime.node.active = false;
    }

    playAnimation(at = 0) {
        const name = "animation";

        this.breakTime.node.active = true;

        this.breakTime.setAnimation(0, name, false);

        const animation = this.breakTime.findAnimation(name);
        const entry = this.breakTime.getCurrent(0);

        if (at > animation.duration) {
            entry.trackTime = animation.duration;
        } else {
            entry.trackTime = at;
        }

        this.breakTime.setCompleteListener(() => {
            this.breakTime.node.active = false;
        });
    }
}
