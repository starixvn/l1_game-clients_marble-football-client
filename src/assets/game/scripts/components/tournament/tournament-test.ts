import { _decorator, Component, Label } from "cc";
import { Tournament } from "./tournament";
const { ccclass, property } = _decorator;

@ccclass("TournamentTest")
export class TournamentTest extends Component {
    @property(Label)
    label: Label = null;

    @property(Tournament)
    tournament: Tournament = null;

    matchId = 12;

    test = {
        id: "674ecfe3d28cfc8630651557",
        matches: [
            {
                home: "LIV",
                away: "PSG",
                homeWins: false,
                id: 34285,
            },
            {
                home: "MCI",
                away: "JUV",
                id: 34286,
            },
            {
                home: "MIL",
                away: "SCP",
                id: 34287,
            },
            {
                home: "BAR",
                away: "RMA",
                id: 34288,
            },
            {
                home: "AVL",
                away: "ARS",
                id: 34289,
            },
            {
                home: "LEV",
                away: "ATM",
                id: 34290,
            },
            {
                home: "FCB",
                away: "ATA",
                id: 34291,
            },
            {
                home: "BVB",
                away: "INT",
                homeWins: true,
                id: 34292,
            },
            {
                home: "LIV",
                away: "MCI",
                homeWins: true,
                id: 34293,
            },
            {
                home: "SCP",
                away: "BAR",
            },
            {
                home: "AVL",
                away: "LEV",
            },
            {
                home: "FCB",
                away: "BVB",
            },
            {
                home: "LIV",
                away: "BAR",
            },
            {
                home: "AVL",
                away: "FCB",
            },
            {
                home: "LIV",
                away: "FCB",
            },
        ],
        currentMatch: 9,
        ended: false,
        code: "UCL",
        time: "2024-12-03T09:31:15.026Z",
        __v: 0,
    };

    onLoad() {
        this.newMethod();
    }

    onClickMatch() {
        this.matchId++;
        this.matchId = this.matchId % 14;
        this.newMethod();
    }

    private newMethod() {
        this.label.string = `Match ${this.matchId}`;
        this.tournament.setData({
            ...this.test,
            currentMatch: this.matchId,
        });
    }
}
