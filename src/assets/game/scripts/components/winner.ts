import { _decorator, Component, Node, sp } from "cc";
import { Flag } from "./flag";
import { TeamName } from "./team-name";

const { ccclass, property } = _decorator;

@ccclass("Winner")
export class Winner extends Component {
    @property(sp.Skeleton)
    private readonly spine: sp.Skeleton = null;

    showWinner(at = 0, winnerName: string, isHomeWin: boolean, isFinal: boolean) {
        const animationType = isFinal ? "champion" : "winner";
        const teamSide = isHomeWin ? "home" : "away";
        const animationName = `${animationType} ${teamSide}`;
        this.playAnimation(this.spine, animationName, at);
        this.setWinnerName(this.spine.node, winnerName);
    }

    setWinnerName(node: Node, name: string) {
        node.getChildByName("team-name").getComponent(TeamName).setName(name);
        node.getComponentInChildren(Flag)?.setIcon(name);
    }

    protected onLoad(): void {
        this.spine.node.active = false;
    }

    protected onDisable(): void {
        this.spine.node.active = false;
    }

    private playAnimation(spine: sp.Skeleton, name: string, at = 0) {
        spine.node.active = true;

        spine.setAnimation(0, name, false);

        const animation = spine.findAnimation(name);
        const entry = spine.getCurrent(0);

        if (at > animation.duration) {
            entry.trackTime = animation.duration;
        } else {
            entry.trackTime = at;
        }

        spine.setCompleteListener(() => {
            spine.node.active = false;
        });
    }
}
