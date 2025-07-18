import { _decorator, Component, Label } from "cc";
const { ccclass, property } = _decorator;

@ccclass("TimeOffset")
export class TimeOffset extends Component {
    @property(Label)
    label: Label = null;

    start() {
        const options: Intl.DateTimeFormatOptions = {
            timeZoneName: "short",
        };
        const timeZoneString = new Intl.DateTimeFormat("en-US", options).format(new Date());
        const match = timeZoneString.match(/GMT([+-]\d+)/);
        this.label.string = `(GMT ${match ? match[1] : ""})`;
    }
}
