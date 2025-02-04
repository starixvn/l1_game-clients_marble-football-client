import inversify from "inversify";
import mobx from "mobx";
import { MarbleFootballServiceMessages } from "../../marble-football-service-messages";

const { injectable } = inversify;

@injectable()
export class TournamentStore {
    private _tournament: MarbleFootballServiceMessages.Tournament = null;
    private _currentMatch: MarbleFootballServiceMessages.MatchType = null;
    private _isFinal = false;

    constructor() {
        mobx.makeAutoObservable(this);
    }

    get tournament() {
        return this._tournament;
    }

    get currentMatch() {
        return this._currentMatch;
    }

    get summary() {
        return {
            matchResult: this._currentMatch,
            isFinal: this._isFinal,
        };
    }

    get isFinal() {
        return this._isFinal;
    }

    set tournament(value: MarbleFootballServiceMessages.Tournament) {
        this._tournament = value;
        this._currentMatch = value.matches[value.currentMatch];
        this._isFinal = value.currentMatch === value.matches.length - 1;
    }
}
