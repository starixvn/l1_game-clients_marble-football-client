import { _decorator, Component, Label } from "cc";
import gc from "@sg/game-client-base";
const { ccclass, property } = _decorator;

@ccclass("HistoryResultHeader")
export class HistoryResultHeader extends Component {
    @property(Label)
    label: Label = null;

    start() {
        this.label.string = `(${gc.Translator.gameTranslate("glossary_home")}  |  ${gc.Translator.gameTranslate("glossary_away")})`;
    }
}
