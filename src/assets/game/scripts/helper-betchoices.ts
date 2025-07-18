import { _decorator, Component, instantiate, Node, sp, v3 } from "cc";
import BetItem from "../../../extensions/shared-components/assets/game/bets/scripts/components/bet-item";
const { ccclass, property } = _decorator;

@ccclass("HelperBetchoices")
export class HelperBetchoices extends Component {
    @property(Node)
    container: Node = null;

    @property(Node)
    sample: Node = null;

    onLoad(): void {
        this.generate();
    }

    generate() {
        if (!this.sample || !this.container) {
            return;
        }
        const betItems = this.getComponentsInChildren(BetItem);
        ["static", "highlight"].forEach((type) => {
            const parentNode = this.container.getChildByName(type);
            betItems.forEach((betItem) => {
                const childNode = parentNode.getChildByName(betItem.node.name);

                if (type === "highlight") {
                    const node = instantiate(this.sample);
                    node.active = true;
                    childNode.addChild(node);
                    node.worldPosition = this.sample.worldPosition;

                    const revert = ["home", "over", "under"].includes(betItem.node.name) ? -1 : 1;
                    node.setScale(v3(node.scale.x * revert, node.scale.y, node.scale.z));

                    const spine = node.getComponent(sp.Skeleton);
                    const nodeName = `${betItem.node.name} win`;
                    node.name = nodeName;
                    spine.setAnimation(0, nodeName, true);
                }

                if (type === "static") {
                    betItem.highlightStatic = childNode;
                } else if (type === "highlight") {
                    betItem.highlightAnim = childNode;
                }
            });
        });
    }
}
