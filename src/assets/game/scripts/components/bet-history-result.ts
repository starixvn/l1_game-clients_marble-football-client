import { _decorator, Color, Label } from "cc";
import gc from "@sg/game-client-base";
import { BaseResultBodyItem } from "db://shared-components/game/bet-history/scripts/components/bet-history-body-item";
import { Flag } from "./flag";
const { ccclass, property } = _decorator;

interface RoundResult {
    firstHalf: string;
    secondHalf: string;

    teamName: { home: string; away: string };
}

@ccclass("BetHistoryResult")
export class BetHistoryResult extends BaseResultBodyItem {
    @property(Flag)
    home: Flag = null;

    @property(Flag)
    away: Flag = null;

    @property(Label)
    homeCode: Label = null;

    @property(Label)
    awayCode: Label = null;

    @property(Label)
    homeScore: Label = null;

    @property(Label)
    awayScore: Label = null;

    setTeams(home: string, away: string) {
        this.home.setIcon(home);
        this.homeCode.string = home;
        this.away.setIcon(away);
        this.awayCode.string = away;
    }

    highlightLabels(label: Label[]) {
        const highlight = new Color().fromHEX("F1E344");
        for (const l of label) {
            l.color = highlight;
        }
    }

    setScore(home: number, away: number) {
        this.homeScore.string = home.toString();
        this.awayScore.string = away.toString();
    }

    setData(result: gc.BetHistory.DynamicObject<any>, settlementResult: gc.BetHistory.DynamicObject<any>) {
        const { teamName, firstHalf, secondHalf } = result as RoundResult;
        this.setTeams(teamName.home, teamName.away);
        const fullScore = `${firstHalf}${secondHalf}`;
        const homeScore = this.countCharacters(fullScore, "H");
        const awayScore = this.countCharacters(fullScore, "A");
        this.setScore(homeScore, awayScore);

        if (homeScore > awayScore) {
            this.highlightLabels([this.homeCode, this.homeScore]);
        }

        if (homeScore < awayScore) {
            this.highlightLabels([this.awayCode, this.awayScore]);
        }
    }

    private countCharacters(str: string, char: string) {
        return str.split(char).length - 1;
    }
}
