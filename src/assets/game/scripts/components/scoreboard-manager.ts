import { _decorator, Component, Node } from "cc";
import gc from "@sg/game-client-base";
import Observer from "observer";
import { FunctionUtils } from "db://shared-components/shared/utils";

const { ccclass, property } = _decorator;
const { handle, useObserver } = Observer;

@ccclass("ScoreboardManager")
export class ScoreboardManager extends Component {
    @property([Node])
    private readonly boards: Node[] = [];

    private boardIndex = 0;

    private dispose: Function;

    onDestroy(): void {
        this.dispose && this.dispose();
    }

    protected onLoad(): void {
        this.boards.forEach((board) => {
            board.active = false;
        });
        this.dispose = useObserver(this, FunctionUtils.getNamespace());
        this.boards[this.boardIndex].active = true;
    }

    @handle(gc.Audios.AudioHandler, (handle) => handle.playSFX(gc.Audios.AudioIds.CLICK))
    private next() {
        this.boards[this.boardIndex].active = false;
        this.boardIndex = (this.boardIndex + 1) % this.boards.length;
        this.boards[this.boardIndex].active = true;
    }

    @handle(gc.Audios.AudioHandler, (handle) => handle.playSFX(gc.Audios.AudioIds.CLICK))
    private prev() {
        this.boards[this.boardIndex].active = false;
        this.boardIndex = (this.boardIndex - 1 + this.boards.length) % this.boards.length;
        this.boards[this.boardIndex].active = true;
    }
}
