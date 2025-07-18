import { VideoStreamStore } from "./video-stream-store";
import { MarbleFootballServiceMessages } from "../../marble-football-service-messages";
import inversify from "inversify";

const { injectable, inject } = inversify;

@injectable()
export class VideoStreamHandlers {
    @inject(VideoStreamStore) private readonly videoStreamStore: VideoStreamStore;

    handleVideoStream(videoResult: MarbleFootballServiceMessages.VideoStream) {
        this.videoStreamStore.videoResult = videoResult;
    }

    handleLiveStreamServer(liveStreamServer: string) {
        this.videoStreamStore.liveStreamServer = liveStreamServer;
    }

    resetForNewRound() {
        this.videoStreamStore.resetForNewRound();
    }

    eventHandleList = [
        {
            name: MarbleFootballServiceMessages.VideoStream.eventName,
            handle: this.handleVideoStream,
        },
        {
            name: MarbleFootballServiceMessages.LiveStreamServer.eventName,
            handle: this.handleLiveStreamServer,
        },
    ];
}
