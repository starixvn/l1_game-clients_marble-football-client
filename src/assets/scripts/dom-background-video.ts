export class DOMBackgroundVideo {
    static readonly GAME_CONTAINER_ID = "Cocos3dGameContainer";
    static readonly GAME_CANVAS_ID = "GameCanvas";

    static readonly VIDEO_ID = "VideoBackground";

    static createOrLoadVideoElement(): HTMLVideoElement {
        const container = document.getElementById(DOMBackgroundVideo.GAME_CONTAINER_ID);
        const game = document.getElementById(DOMBackgroundVideo.GAME_CANVAS_ID);
        const video = document.getElementById(DOMBackgroundVideo.VIDEO_ID) as HTMLVideoElement;

        if (game) {
            DOMBackgroundVideo.applyGameStyles(game);
        }

        if (!video) {
            const video = document.createElement("video");
            const size = container.getBoundingClientRect();

            video.id = DOMBackgroundVideo.VIDEO_ID;
            const savedMuted = localStorage.getItem("videoMuted") === "false";
            const savedVolume = localStorage.getItem("videoVolume") || "1";

            video.muted = !savedMuted;
            video.volume = parseFloat(savedVolume);

            DOMBackgroundVideo.applyVideoStyles(video, size);
            container.insertBefore(video, container.firstChild);
            DOMBackgroundVideo.registerEvents();

            return video;
        }

        return video;
    }

    static removeVideoElement() {
        const video = document.getElementById(DOMBackgroundVideo.VIDEO_ID) as HTMLVideoElement;

        if (video) {
            DOMBackgroundVideo.unregisterEvents();
            video.remove();
        }
    }

    private static applyVideoStyles(video: HTMLVideoElement, size: DOMRect) {
        video.style.visibility = "visible";
        video.style.position = "absolute";
        video.style.bottom = "0px";
        video.style.left = "0px";
        video.style.width = `${size.width}px`;
        video.style.height = `${size.height}px`;
        video.style.zIndex = "10";
        video.width = size.width;
        video.height = size.height;
        video.playsInline = true;
        video.autoplay = true;
        video.preload = "auto";
    }

    private static applyGameStyles(game: HTMLElement) {
        game.style.zIndex = "11";
        game.style.position = "relative";
    }

    private static onResize() {
        const container = document.getElementById(DOMBackgroundVideo.GAME_CONTAINER_ID);
        const size = container.getBoundingClientRect();
        const video = DOMBackgroundVideo.createOrLoadVideoElement();

        DOMBackgroundVideo.applyVideoStyles(video, size);
    }

    private static registerEvents() {
        window.addEventListener("resize", DOMBackgroundVideo.onResize);
    }

    private static unregisterEvents() {
        window.removeEventListener("resize", DOMBackgroundVideo.onResize);
    }
}
