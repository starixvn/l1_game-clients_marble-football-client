import gc from "@sg/game-client-base";
import { _decorator, instantiate, Node, Prefab } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { BackgroundVideoPlayer } from "../../../scripts/background-video-player";
import { VideoStreamHandlers } from "../features/feature";
import { GamePhase, PhaseId } from "../features/game-phase/game-phase-definitions";
import { GamePhaseStore } from "../features/game-phase/game-phase-store";
import { StreamingVideo, VideoStreamStore } from "../features/video-stream/video-stream-store";
import { settings } from "../game-settings";
import { MarbleFootballServiceMessages } from "../marble-football-service-messages";
import { BreakTime } from "./break-time";
import { IntroOutro } from "./intro-outro";
import { NetworkStatus, SystemIndicator } from "./system-indcator";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;
const { sentryLogger } = gc;

const INTRO_SFX = "intro_video";

@ccclass
export default class VideoStreamIntegration extends ObserverComponent {
    @property(BackgroundVideoPlayer)
    private backgroundVideoPlayer: BackgroundVideoPlayer = null;

    @property(Node)
    private nodeBreakTime: Node = null;

    @property(Node)
    private nodeSystemIndicator: Node = null;

    @property(IntroOutro)
    private introOutro: IntroOutro = null;

    @property(Prefab)
    private warnPrefab: Prefab = null;

    @property(Node)
    private warnContainer: Node = null;

    private isLiveVideo = false;

    private blockShowFieldWithSyncNativeCurrentTime = false;
    private _systemIndicator: SystemIndicator = null;

    get systemIndicator() {
        if (!this._systemIndicator) {
            this._systemIndicator = this.nodeSystemIndicator.getComponentInChildren(SystemIndicator);
        }
        return this._systemIndicator;
    }

    private _breakTime: BreakTime = null;

    get breakTime() {
        if (!this._breakTime) {
            this._breakTime = this.nodeBreakTime.getComponentInChildren(BreakTime);
        }
        return this._breakTime;
    }

    onLoad(): void {
        this.backgroundVideoPlayer?.node.on("hlsLevelSwitched", this.updateSystemIndicator, this);
        this.backgroundVideoPlayer?.node.on("hlsError", this.updateSystemIndicator, this);
        this.backgroundVideoPlayer?.node.on("hlsError", this.onHLSError, this);
        this.backgroundVideoPlayer?.node.on("hlsManifestLoading", () => (this.introOutro.showField = true));
        this.backgroundVideoPlayer?.node.on("syncNativeCurrentTime", (time: number) => {
            if (this.blockShowFieldWithSyncNativeCurrentTime) {
                return;
            }

            const showField = time <= 0;
            this.introOutro.showField = showField;
        });
        this.backgroundVideoPlayer?.node.on("hlsNotSupported", this.onHSLNotSupported, this);
        this.warnContainer?.removeAllChildren();

        super.onLoad();
    }

    @render(VideoStreamStore, (store) => ({
        isFirstHalf: store.isFirstHalf,
        currentVideoTime: store.currentVideoTime,
    }))
    showFieldBeforeFirstHalfVideoEnd({ isFirstHalf, currentVideoTime }: { isFirstHalf: boolean; currentVideoTime: number }) {
        // Show field before first half video end 100ms
        if (isFirstHalf && currentVideoTime === settings.durations.videoDuration - 1) {
            this.scheduleOnce(() => {
                this.introOutro.showField = true;
                this.blockShowFieldWithSyncNativeCurrentTime = true;

                // Unblock show field after 2 seconds
                this.scheduleOnce(() => {
                    this.blockShowFieldWithSyncNativeCurrentTime = false;
                }, 2);
            }, 0.9);
        }
    }

    @render(VideoStreamStore, (store) => store.currentVideo)
    renderVideoSource(currentVideo: StreamingVideo) {
        if (currentVideo?.videoName) {
            this.backgroundVideoPlayer.currentTime = currentVideo.time;
            this.backgroundVideoPlayer.playVideoByName(currentVideo.videoName);
        }
    }

    @render(VideoStreamStore, (store) => ({
        isFirstHalf: store.isFirstHalf,
        isBreakTime: store.isBreakTime,
        videoResult: store.videoResult,
    }))
    bufferVideo({
        isFirstHalf,
        isBreakTime,
        videoResult,
    }: {
        isFirstHalf: boolean;
        isBreakTime: boolean;
        videoResult: MarbleFootballServiceMessages.VideoStream;
    }) {
        if (!videoResult || !videoResult.firstHalfVideo || !videoResult.secondHalfVideo) {
            return;
        }

        if (isFirstHalf && !isBreakTime) {
            this.backgroundVideoPlayer.currentTime = 0;
            this.backgroundVideoPlayer.loadVideoByName(videoResult.firstHalfVideo);
            return;
        }

        if (isBreakTime) {
            this.backgroundVideoPlayer.currentTime = 0;
            this.backgroundVideoPlayer.loadVideoByName(videoResult.secondHalfVideo);
        }
    }

    @render(gc.Rounds.RoundTimeStore, (store) => store.isStartRound)
    private onStartingRound(isStartRound: boolean) {
        if (isStartRound) {
            this.resetVideoStream();
        }
    }

    @render(gc.Rounds.RoundTimeStore, (store) => store.roundTime)
    private onUpdateRoundTime(currentTime: number) {
        this.updateVideoTimeAndScore(currentTime);
    }

    @render(VideoStreamStore, (store) => store.liveStreamServer)
    private onLiveStreamServer(liveStreamServer: string) {
        this.backgroundVideoPlayer.init(liveStreamServer);
    }

    @render(gc.Settlements.SettlementStore, (store) => store.currentFinish, {
        fireImmediately: false,
    })
    showPlayArea(currentFinish: gc.GameServiceMessage.Finish) {
        if (!currentFinish) {
            return;
        }
        this.introOutro.playOutroAnimation(0, settings.durations.outro);
    }

    @render(gc.Rounds.RoundTimeStore, (store) => store.roundTime)
    private onRoundTimeUpdate(roundTime: number) {
        if (roundTime === settings.durations.introVideo) {
            this.scheduleOnce(() => {
                this.playSound();
            }, 0.75);
            this.introOutro.playIntroAnimation();
            this.breakTime?.playAnimation(0);
        }

        this.introOutro.showGameBackground = roundTime > settings.durations.introVideo || roundTime < 0;
    }

    @handle(gc.Audios.AudioHandler, (handler, id: string) => handler.playSFX(id))
    playSound() {
        return INTRO_SFX;
    }

    @handle(VideoStreamHandlers, (handler) => handler.resetForNewRound())
    private resetVideoStream() {}

    @handle(VideoStreamStore, (store, time: number) => store.updateWithRoundTime(time))
    private updateVideoTimeAndScore(currentTime: number) {
        return currentTime;
    }

    private updateSystemIndicator(data: { level?: number } | string) {
        if (typeof data === "object" && data.level !== undefined) {
            // On level changed
            this.systemIndicator.networkStatus = data.level + 2;
        } else {
            // On error, set to disconnected
            this.systemIndicator.networkStatus = NetworkStatus.DISCONNECTED;

            const segmentTime = 3; // second

            this.scheduleOnce(() => {
                this.systemIndicator.networkStatus = this.backgroundVideoPlayer.level + 2;
            }, segmentTime);
        }
    }

    private onHLSError(data: any) {
        if (data?.type === "mediaError") {
            return;
        }

        sentryLogger?.logError(JSON.stringify(data));
    }

    private onHSLNotSupported() {
        if (this.warnContainer?.children?.length > 0 || !this.isLiveVideo) {
            return;
        }

        this.systemIndicator.networkStatus = NetworkStatus.DISCONNECTED;

        const node = instantiate(this?.warnPrefab);
        node && this.warnContainer?.addChild(node);
    }

    @render(VideoStreamStore, (store) => store.isLiveVideo)
    private liveVideo(isLiveVideo: boolean) {
        this.isLiveVideo = isLiveVideo;
        if (!isLiveVideo) {
            this.warnContainer?.removeAllChildren();
        }
    }

    @render(GamePhaseStore, (store) => store.enterPhase)
    private renderEnterPhase(phase: GamePhase) {
        if (!phase) {
            return;
        }
        if (phase.id === PhaseId.Halftime) {
            AnimationUtils.fadeOut(this.warnContainer, 0.2);
        }
    }

    @render(GamePhaseStore, (store) => store.exitPhase)
    private renderExitPhase(phase: GamePhase) {
        if (!phase) {
            return;
        }
        if (phase.id === PhaseId.Halftime) {
            AnimationUtils.fadeIn(this.warnContainer, 0.2);
        }
    }
}
