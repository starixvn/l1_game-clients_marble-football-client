import { _decorator, Component, log } from "cc";
import Hls from "hls.js";
import { DOMBackgroundVideo } from "./dom-background-video";

const { ccclass } = _decorator;

@ccclass("BackgroundVideoPlayer")
export class BackgroundVideoPlayer extends Component {
    private hls: Hls = null;
    private native: HTMLVideoElement = null;

    private _videoSource: string = "";
    private _videoName: string = "";
    private liveStreamServer: string = "";
    private _muted = true;

    private get initialized() {
        return !!this.native && !!this.hls;
    }

    currentTime = 0;

    init(liveStreamServer: string) {
        this.liveStreamServer = liveStreamServer;
    }

    loadVideoByName(videoName: string) {
        if (!videoName?.trim() || !this.liveStreamServer) {
            return;
        }

        if (this._videoName !== videoName || !this.initialized) {
            this._videoName = videoName;
            this._videoSource = new URL(`${videoName.trim()}.m3u8`, this.liveStreamServer).toString();
            this.loadSource();
        }
    }

    playVideoByName(videoName: string) {
        this.loadVideoByName(videoName);

        this.play();
    }

    resetAllSettings() {
        this._videoSource = "";
        this._videoName = "";
    }

    get bandwidthEstimate() {
        return this.hls?.bandwidthEstimate ?? 0;
    }

    gotUserGesture() {
        this.native.volume = 1;
        localStorage.setItem("videoMuted", "false");
        localStorage.setItem("videoVolume", "1");
    }

    loadSource() {
        console.log("loadSource", this._videoSource);
        if (!this.initialized) {
            this.initialize();
        }
        this.hls.loadSource(this._videoSource);
        this.pause();
    }

    play(retry = 0, maxRetry = 3) {
        console.log("video play with muted ", this.native?.muted);
        // Fix for iOS 17, video element is not playing immediately
        this.native.play().catch(() => {
            if (retry < maxRetry) {
                this.play(retry + 1, maxRetry);
            }
        });
    }

    pause() {
        if (this.initialized) {
            this.native.pause();
        }
    }

    set muted(value: boolean) {
        this._muted = value;

        if (this.initialized) {
            log("video player set muted ", value);
            this.native.muted = value;
            localStorage.setItem("videoMuted", value.toString());
        }
    }

    get level() {
        return this.hls?.currentLevel ?? 0;
    }

    protected lateUpdate(dt: number): void {
        this.currentTime += dt;
    }

    onLoad() {
        this.initialize();
    }

    protected onDestroy(): void {
        this.stop();
    }

    stop() {
        if (this.initialized) {
            this.native.removeEventListener("timeupdate", this.syncCurrentTime.bind(this));

            this.hls.off(Hls.Events.ERROR);
            this.hls.detachMedia();
            this.hls.destroy();
        }
    }

    private syncCurrentTime() {
        const needSync = this.currentTime >= 0 && Math.abs(this.currentTime - this.native.currentTime) > 1;

        if (this.initialized && needSync) {
            this.native.currentTime = this.currentTime;
        }
    }

    private initialize() {
        const video = DOMBackgroundVideo.createOrLoadVideoElement();

        if (!Hls.isSupported()) {
            this.node.emit("hlsNotSupported");
            throw new Error("Hls.js is not supported.");
        }

        const hls = new Hls({
            startLevel: -1,
            capLevelToPlayerSize: true,
            lowLatencyMode: true,
            liveSyncDuration: 0.9,
            liveMaxLatencyDuration: 1,
            // maxBufferSize: 2 * 1000_000, // MB
            // maxBufferLength: 1, // in seconds
            // maxMaxBufferLength: 3, // in seconds
        });

        video.addEventListener("timeupdate", this.syncCurrentTime.bind(this));
        hls.attachMedia(video);

        hls.on(Hls.Events.LEVEL_SWITCHED, this.node.emit.bind(this.node));
        hls.on(Hls.Events.MANIFEST_LOADING, this.node.emit.bind(this.node));
        hls.on(Hls.Events.MANIFEST_PARSED, this.node.emit.bind(this.node));
        hls.on(Hls.Events.FRAG_BUFFERED, this.node.emit.bind(this.node));
        hls.on(Hls.Events.FRAG_CHANGED, this.node.emit.bind(this.node));
        hls.on(Hls.Events.ERROR, (event, data) => {
            this.node.emit(event, {
                ...data,
                video: this._videoName,
                server: this.liveStreamServer,
                bandwidth: this.bandwidthEstimate,
            });
            this.syncCurrentTime();
        });

        this.hls = hls;
        this.native = video;
    }
}
