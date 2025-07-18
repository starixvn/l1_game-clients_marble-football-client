import { _decorator, Component, Sprite } from "cc";

const { ccclass, property } = _decorator;

@ccclass("Flag")
export class Flag extends Component {
    @property(Sprite)
    private readonly icon: Sprite = null;

    setIcon(icon: string) {
        const atlas = this.icon.spriteAtlas;
        const spriteFrame = atlas.getSpriteFrame(icon);

        this.icon.spriteFrame = spriteFrame;
    }
}
