import { TournamentStore } from "./tournament-store";
import { MarbleFootballServiceMessages } from "../../marble-football-service-messages";
import inversify from "inversify";

const { injectable, inject } = inversify;

@injectable()
export class TournamentHandlers {
    @inject(TournamentStore) private readonly tournamentStore: TournamentStore;

    handleTournament(tournament: MarbleFootballServiceMessages.Tournament) {
        this.tournamentStore.tournament = tournament;
    }

    eventHandleList = [
        {
            name: MarbleFootballServiceMessages.Tournament.eventName,
            handle: this.handleTournament,
        },
    ];
}
