import gc from "@sg/game-client-base";
import inversify from "inversify";
import mobx from "mobx";
import { MarbleFootballServiceMessages } from "../../marble-football-service-messages";
import { TournamentStore } from "../tournament/tournament-store";
import { MatchResultStore } from "./match-result-store";

const { injectable, inject } = inversify;

interface RoundResult {
    roundId: number;
    result: MarbleFootballServiceMessages.Result;
    settlementResult: any;
}

@injectable()
export class MatchResultHandler {
    @inject(gc.RoundHistories.RoundHistoryStore) private readonly roundHistoryStore: gc.RoundHistories.RoundHistoryStore;
    @inject(gc.Settlements.SettlementStore) private readonly settlementStore: gc.Settlements.SettlementStore;
    @inject(MatchResultStore) private readonly store: MatchResultStore;
    @inject(TournamentStore) private readonly tournamentStore: TournamentStore;

    constructor() {
        mobx.makeAutoObservable(this);

        setTimeout(() => {
            mobx.reaction(
                () => {
                    if (!this.tournamentStore.currentMatch) {
                        return null;
                    }
                    return this.roundHistoryStore.histories;
                },
                (histories: gc.RoundHistories.RoundHistory[]) => {
                    if (!histories || histories.length === 0) {
                        return;
                    }
                    const lastRound = histories[0] as RoundResult;
                    lastRound && this.generateMatchResult(lastRound);
                }
            );
        }, 0);

        setTimeout(() => {
            mobx.reaction(
                () => {
                    if (!this.tournamentStore.currentMatch) {
                        return null;
                    }
                    return this.settlementStore.currentFinish;
                },
                (currentFinish: RoundResult) => {
                    if (!currentFinish) {
                        return;
                    }
                    this.generateMatchResult(currentFinish);
                }
            );
        }, 0);
    }

    generateMatchResult(roundResult: RoundResult) {
        const { roundId, result, settlementResult } = roundResult;

        if (roundId === this.store.matchResult?.roundId) {
            return;
        }

        const miniGame = result.homeWinsOnDraw !== undefined && settlementResult.draw;
        const scores = this.parseMatchScore(result);

        const currentMatch = this.tournamentStore.currentMatch;
        const isHomeWin = settlementResult.home || (miniGame && result.homeWinsOnDraw);
        const winner = isHomeWin ? currentMatch.home : currentMatch.away;
        const penalty = result.penalty;

        this.store.matchResult = {
            roundId,
            scores,
            miniGame,
            penalty,
            winner,
            isHomeWin,
            homeWinsOnDraw: !!result.homeWinsOnDraw,
            isFinal: this.tournamentStore.isFinal,
        };
    }

    parseMatchScore(result: MarbleFootballServiceMessages.Result) {
        const { firstHalf, secondHalf, firstHalfTimeline, secondHalfTimeline } = result;

        const matchHalves = [
            { goals: firstHalf, timeline: firstHalfTimeline },
            { goals: secondHalf, timeline: secondHalfTimeline },
        ];

        const halftimeScores = matchHalves.map((half) => {
            const scores = {
                H: 0,
                A: 0,
            };

            for (let i = 0; i < half.goals.length; i++) {
                const scoringTeam = half.goals.charAt(i);
                if (scoringTeam !== "H" && scoringTeam !== "A") {
                    continue;
                }
                scores[scoringTeam]++;
            }
            return [scores.H, scores.A];
        });

        const finalScore = halftimeScores.reduce((total, current) => [total[0] + current[0], total[1] + current[1]], [0, 0]);

        return [...halftimeScores, finalScore];
    }
}
