import inversify from "inversify";
import mobx from "mobx";
import { MarbleFootballServiceMessages } from "../../marble-football-service-messages";
import { settings } from "./../../game-settings";

const { injectable } = inversify;

export type StreamingVideo = {
    videoName: string;
    time: number;
    isFirstHalf: boolean;
};

type VideoData = {
    videoName: string;
    videoResult: string;
    videoTimeline: number[];
};

@injectable()
export class VideoStreamStore {
    private _videoResult: MarbleFootballServiceMessages.VideoStream = {} as any;
    private _currentVideo: StreamingVideo = {} as any;
    private _homeScore = 0;
    private _awayScore = 0;
    private _currentVideoTime = -1;
    private _roundTime = -1;
    private _isFirstHalf = true;
    private _isFirstLoad = true;
    private _isBreakTime = false;
    private _currentMatchTime = 0;
    private _isLiveVideo = false;

    liveStreamServer = "";

    constructor() {
        mobx.makeAutoObservable(this);
    }

    updateWithRoundTime(roundTime: number) {
        this._roundTime = roundTime;
        this._currentVideoTime = this.calculateCurrentVideoTime();

        if (this._currentVideoTime > 0 && this._currentVideoTime <= settings.durations.halfDuration) {
            this._currentMatchTime++;
        }

        this._isFirstHalf =
            roundTime > settings.durations.videoDuration && roundTime <= settings.durations.placingBet + settings.durations.startRound;

        this._isBreakTime =
            roundTime <= settings.durations.streamingVideo - settings.durations.videoDuration &&
            roundTime > settings.durations.videoDuration;

        this._isLiveVideo = !this._isBreakTime && roundTime >= 0 && roundTime <= settings.durations.streamingVideo;

        this.updateCurrentVideoAndScores();
    }

    updateCurrentVideoAndScores() {
        const currentVideoTime = this._currentVideoTime;
        const videoData = this.getVideoData();

        if (!videoData) {
            return;
        }

        if (this._isFirstLoad) {
            const currentMatchTime = this.calculateCurrentMatchTime();
            this._currentMatchTime = currentMatchTime;
            this.updateScoresBeforeCurrentTime(videoData, currentMatchTime);
            this._isFirstLoad = false;
        }

        if (currentVideoTime === -1) {
            return;
        }

        if (this._currentVideo.videoName !== videoData.videoName || this._currentVideo.isFirstHalf !== this.isFirstHalf) {
            this._currentVideo = {
                videoName: videoData.videoName,
                time: currentVideoTime,
                isFirstHalf: this._isFirstHalf,
            };
        }

        this.updateCurrentScores(videoData, currentVideoTime);
    }

    private updateScoresBeforeCurrentTime(videoData: VideoData, currentMatchTime: number) {
        let homeScore = 0;
        let awayScore = 0;

        let time = currentMatchTime;

        if (time >= settings.durations.halfDuration) {
            homeScore = this._videoResult.firstHalf.split("H").length - 1;
            awayScore = this._videoResult.firstHalf.split("A").length - 1;
            time -= settings.durations.halfDuration;
        }

        if (time >= settings.durations.halfDuration) {
            homeScore += this._videoResult.secondHalf.split("H").length - 1;
            awayScore += this._videoResult.secondHalf.split("A").length - 1;
            time -= settings.durations.halfDuration;
        }

        if (time > 0) {
            videoData.videoTimeline.forEach((scoreTime, index) => {
                if (Math.ceil(scoreTime) < time) {
                    const goal = videoData.videoResult[index];

                    if (goal === "H") {
                        homeScore++;
                    } else if (goal === "A") {
                        awayScore++;
                    }
                }
            });
        }

        this._homeScore = homeScore;
        this._awayScore = awayScore;
    }

    private updateCurrentScores(videoData: VideoData, currentVideoTime: number) {
        const currentScoreIndex = videoData.videoTimeline.findIndex((scoreTime) => Math.ceil(scoreTime) === currentVideoTime);

        if (currentScoreIndex !== -1) {
            const goal = videoData.videoResult[currentScoreIndex];

            if (goal === "H") {
                this._homeScore++;
            } else if (goal === "A") {
                this._awayScore++;
            }
        }
    }

    private getVideoData(): VideoData {
        const isFirstHalf = this._isFirstHalf;

        const videoName = isFirstHalf ? this._videoResult.firstHalfVideo : this._videoResult.secondHalfVideo;
        const videoTimeline = isFirstHalf ? this._videoResult.firstHalfTimeline : this._videoResult.secondHalfTimeline;
        const videoResult = isFirstHalf ? this._videoResult.firstHalf : this._videoResult.secondHalf;

        if (!videoName || !videoTimeline || !videoResult) {
            return null;
        }

        return { videoName, videoTimeline, videoResult };
    }

    calculateCurrentVideoTime() {
        const roundTime = this._roundTime;

        if (roundTime > settings.durations.streamingVideo) {
            return -1;
        }

        if (roundTime <= settings.durations.streamingVideo && roundTime > settings.durations.videoDuration) {
            const videoTime = settings.durations.streamingVideo - roundTime;
            return videoTime <= settings.durations.videoDuration ? videoTime : -1;
        }

        if (roundTime <= settings.durations.videoDuration && roundTime >= 0) {
            return settings.durations.videoDuration - roundTime;
        }

        return -1;
    }

    calculateCurrentMatchTime() {
        const roundTime = this._roundTime;

        if (roundTime > settings.durations.placingBet + settings.durations.startRound) {
            return settings.durations.halfDuration * 2;
        }

        if (roundTime <= settings.durations.streamingVideo && roundTime > settings.durations.videoDuration) {
            const matchTime = settings.durations.streamingVideo - roundTime;
            return matchTime < settings.durations.halfDuration ? matchTime : settings.durations.halfDuration;
        }

        if (roundTime <= settings.durations.videoDuration && roundTime >= 0) {
            const secondHalfTime = settings.durations.videoDuration - roundTime;
            return secondHalfTime < settings.durations.halfDuration
                ? secondHalfTime + settings.durations.halfDuration
                : settings.durations.halfDuration * 2;
        }

        return 0;
    }

    set videoResult(source: MarbleFootballServiceMessages.VideoStream) {
        this._videoResult = source;
        this.resetScores();
    }

    get videoResult(): MarbleFootballServiceMessages.VideoStream {
        return this._videoResult;
    }

    get isBreakTime(): boolean {
        return this._isBreakTime;
    }

    get currentVideo(): StreamingVideo {
        return this._currentVideo;
    }

    get homeScore(): number {
        return this._homeScore;
    }

    get awayScore(): number {
        return this._awayScore;
    }

    get currentVideoTime(): number {
        return this._currentVideoTime;
    }

    get isFirstHalf(): boolean {
        return this._isFirstHalf;
    }

    get currentMatchTime(): number {
        return this._currentMatchTime;
    }

    get isLiveVideo(): boolean {
        return this._isLiveVideo;
    }

    resetForNewRound() {
        this._currentVideoTime = -1;
        this._currentVideo = {} as any;
        this._videoResult = {} as any;
        this._isFirstHalf = true;
        this._currentMatchTime = 0;
        this.resetScores();
    }

    private resetScores(): void {
        this._homeScore = 0;
        this._awayScore = 0;
    }
}
