import { _decorator, Component, Label, sp } from "cc";

const { ccclass, property } = _decorator;

@ccclass("MiniGame")
export class MiniGame extends Component {
    @property(sp.Skeleton)
    private readonly home: sp.Skeleton = null;

    @property(sp.Skeleton)
    private readonly away: sp.Skeleton = null;

    @property(sp.Skeleton)
    private readonly statistic: sp.Skeleton = null;

    @property(sp.Skeleton)
    private readonly game: sp.Skeleton = null;

    protected onLoad(): void {
        this.disableAllSkeletonNodes();
    }

    protected onDisable(): void {
        this.disableAllSkeletonNodes();
    }

    playStatistic(at = 0) {
        this.playAnimation(
            { spine: this.statistic, animation: "animation" },
            [
                { spine: this.home, animation: "home" },
                { spine: this.away, animation: "away" },
            ],
            at
        );
    }

    setScores(scores: number[][]) {
        const labels = [
            ["first-half-home", "first-half-away"],
            ["second-half-home", "second-half-away"],
            ["fulltime-home", "fulltime-away"],
        ];

        labels.forEach((sides, halfIndex) => {
            sides.forEach((side, sideIndex) => {
                this.statistic.node.getChildByName(side).getComponent(Label).string = scores[halfIndex][sideIndex].toString();
            });
        });

        const finalScore = scores[2];
        const isHomeWin = finalScore[0] > finalScore[1];
        this.setWinLoseLabel(isHomeWin);
    }

    playMiniGame(isHomeWin: boolean, roundId: number, at = 0) {
        const index = (roundId % 3) + 1;
        const animation = isHomeWin ? `red win ${index}` : `blue win ${index}`;

        this.playAnimation(
            { spine: this.game, animation },
            [
                { spine: this.home, animation: "home" },
                { spine: this.away, animation: "away" },
            ],
            at
        );
        this.setWinLoseLabel(isHomeWin);
    }

    setWinLoseLabel(isHomeWin: boolean) {
        this.home.node.getChildByPath("result/win").active = isHomeWin;
        this.away.node.getChildByPath("result/lose").active = isHomeWin;

        this.home.node.getChildByPath("result/lose").active = !isHomeWin;
        this.away.node.getChildByPath("result/win").active = !isHomeWin;
    }

    private playAnimation(
        main: { spine: sp.Skeleton; animation: string },
        side: { spine: sp.Skeleton; animation: string }[],
        at = 0
    ) {
        main.spine.node.active = true;

        const mainAnimation = main.spine.findAnimation(main.animation);

        if (at > mainAnimation.duration) {
            main.spine.setAnimation(0, main.animation, false);

            main.spine.getCurrent(0).trackTime = mainAnimation.duration;
        } else {
            main.spine.setAnimation(0, main.animation, false);
            main.spine.getCurrent(0).trackTime = at;

            side.forEach((s) => {
                s.spine.node.active = true;

                const duration = s.spine.findAnimation(s.animation).duration;
                const delay = mainAnimation.duration - duration - at;

                s.spine.setAnimation(0, s.animation, false);

                const entry = s.spine.getCurrent(0);

                if (delay > 0) {
                    entry.delay = delay;
                } else {
                    const startAt = delay + duration;

                    if (startAt > duration) {
                        entry.trackTime = duration;
                    } else {
                        entry.trackTime = startAt;
                    }
                }

                s.spine.setCompleteListener(() => {
                    s.spine.node.active = false;
                });
            });
        }

        main.spine.setCompleteListener(() => {
            main.spine.node.active = false;
        });
    }

    private disableAllSkeletonNodes() {
        this.home.node.active = false;
        this.away.node.active = false;
        this.statistic.node.active = false;
        this.game.node.active = false;
    }
}
