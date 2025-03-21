import { _decorator, Component, Enum, sp, Node } from "cc";

const { ccclass, property } = _decorator;

export enum NetworkStatus {
    DISCONNECTED = 1,
    BAD = 2, // Play 240p
    GOOD = 3, // Play 720p
}

@ccclass("SystemIndicator")
export class SystemIndicator extends Component {
    private _networkStatus: NetworkStatus = NetworkStatus.GOOD;

    @property(Node)
    private liveNode: Node = null;

    set networkStatus(value: NetworkStatus) {
        this._networkStatus = value;
    }

    setLiveIndicatorVisibility(isLiveVideo: boolean) {
        this.liveNode && (this.liveNode.active = isLiveVideo);
    }
}
