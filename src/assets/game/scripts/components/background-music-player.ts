import { _decorator, AudioSource, tween } from "cc";
import MusicPlayer from "db://shared-components/game/audios/scripts/component/music-player";
import Observer from "observer";
import { VideoStreamSoundStore } from "../features/video-stream/video-stream-sound-store";
const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass("BackgroundMusicPlayer")
export class BackgroundMusicPlayer extends MusicPlayer {
    @property(AudioSource)
    musicSource: AudioSource = null;

    _stopBackgroundMusic = false;

    _currentVolume = 1;

    onEnable() {
        this.musicSource.node.on(AudioSource.EventType.STARTED, this.onMusicStarted, this);
    }

    onMusicStarted() {
        if (this._stopBackgroundMusic) {
            this.musicSource.stop();
        }
    }

    @render(VideoStreamSoundStore, (store) => store.isPlayBackgroundMusic)
    playMusic(playBackgroundMusic: boolean) {
        this._stopBackgroundMusic = !playBackgroundMusic;
        if (playBackgroundMusic) {
            if (this.musicSource.state === AudioSource.AudioState.STOPPED || this.musicSource.state === AudioSource.AudioState.INIT) {
                this.musicSource.play();
                this.callPlayMusic();
            }
            if (this.musicSource.volume <= 0) {
                tween(this.musicSource).to(1, { volume: this._currentVolume }).start();
            }
        } else {
            if (this.musicSource.state === AudioSource.AudioState.PLAYING) {
                this._currentVolume = this.musicSource.volume;
                tween(this.musicSource).to(1, { volume: 0 }).start();
            }
        }
    }

    enableMusic(musicEnable: boolean): void {}
}
