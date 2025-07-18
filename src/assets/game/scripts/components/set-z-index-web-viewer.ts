import { _decorator, CCInteger, CCString, Component } from "cc";
const { ccclass, property } = _decorator;

@ccclass("SetZIndexWebViewer")
export class SetZIndexWebViewer extends Component {
    @property(CCString)
    id = "webview-wrapper";

    @property(CCInteger)
    zIndex = 99;

    start() {
        const head = document.head;
        const style = document.createElement("style");
        style.innerHTML = `#${this.id} { z-index: ${this.zIndex}; }`;
        head.appendChild(style);
    }
}
