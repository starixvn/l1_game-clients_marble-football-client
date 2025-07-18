import { _decorator, tween } from "cc";
import gc from "@sg/game-client-base";
import { ActionChipFlying } from "db://shared-components/game/chip-flying/scripts/components/actions";
import { ChipFlying as ChipFlyingShared, IChipFlyingInfo } from "db://shared-components/game/chip-flying/scripts/components/chip-flying";
import Observer from "observer";
import { TBalanceEffect, TWinningEffect } from "db://shared-components/game/balance-effect/scripts/stores/balance-effect-store";
import { AroundTablePlayerUtils } from "db://shared-components/game/around-table-player/scripts/utils";

const { ccclass, property } = _decorator;
const { handle } = Observer;

const CHIP_SOUND_ID = {
    GATHER_CHIPS: "gather-chips",
    DIVIDE_CHIPS: "divide-chips",
    PAY_CHIPS: "pay-chips",
};

@ccclass("ChipFlying")
export class ChipFlying extends ChipFlyingShared {
    actionPayChips(animated: boolean) {
        if (!animated) {
            ActionChipFlying.dealerGetChips(this.dealerChipBox, this.betItems?.lostBetItems, this);
            ActionChipFlying.dealerPayChips(this.dealerChipBox, this.betItems?.winBetItems, this);
            this.payChipToAllPlayersNew();
            return;
        }

        tween(this.node)
            .call(() => {
                if (this.betItems?.lostBetItems?.length > 0) {
                    this.handlePlaySound(CHIP_SOUND_ID.GATHER_CHIPS);
                }
                ActionChipFlying.dealerGetChips(this.dealerChipBox, this.betItems?.lostBetItems, this);
            })
            .delay(this.chipDelayFlyingTime)
            .call(() => {
                if (this.betItems?.winBetItems?.length > 0) {
                    this.handlePlaySound(CHIP_SOUND_ID.DIVIDE_CHIPS);
                }
                ActionChipFlying.dealerPayChips(this.dealerChipBox, this.betItems?.winBetItems, this);
            })
            .delay(this.chipDelayFlyingTime)
            .call(() => {
                this.payChipToAllPlayersNew();
            })
            .start();
    }

    payChipToAllPlayersNew() {
        const chipFlyingInfo: IChipFlyingInfo = {
            slidingChip: this.slidingChip,
            hiddenPlayersNode: this.hiddenPlayersNode,
            mainPlayerAvatarNode: this.mainPlayerAvatarNode,
            payChipsDuration: this.payChipsDuration,
        };

        ActionChipFlying.payChipsToMainPlayer(this.settlementStatus, chipFlyingInfo, this.betItems?.winBetItems, this);
        this.showPayoutForMainPlayerNew();

        if (this.hiddenPlayersNode) {
            ActionChipFlying.payChipsToHiddenPlayers(this.hiddenPlayersNode, this.betItems?.winBetItems, this);
        }

        this.payChipsToAroundTablePlayers();
        this.startShowResultAnimation = false;
    }

    protected payChipsToAroundTablePlayers() {
        if (this.winningPlayers === null || Object.keys(this.winningPlayers).length === 0) {
            return;
        }
        this.handlePlaySound(CHIP_SOUND_ID.PAY_CHIPS);

        const winningPlayerIds = Object.keys(this.winningPlayers);
        const winningEffects: TWinningEffect[] = [];
        const balanceEffects: TBalanceEffect[] = [];

        winningPlayerIds.forEach((playerId) => {
            const aroundTablePlayerSlot = AroundTablePlayerUtils.getAroundTablePlayerSlot(
                this.aroundTablePlayers?.aroundTablePlayerComponents,
                playerId
            );
            if (!aroundTablePlayerSlot) {
                return;
            }

            const winningPlayerData = this.winningPlayers[playerId];
            const playerBetItems = winningPlayerData.winningByChoices;

            this.betItems.winBetItems.forEach((item) => {
                const chipNodes = this.getChipsByChoice(item.betChoice);
                if (playerBetItems && playerBetItems[item.betChoice] > 0) {
                    this.moveChipsWithRandomAmount(chipNodes, aroundTablePlayerSlot.avatar.node, this.payChipsDuration);
                }
            });

            const { bet } = winningPlayerData;
            aroundTablePlayerSlot.increaseBalance(bet);
            winningEffects.push({ effectNode: aroundTablePlayerSlot.node, status: true });
            balanceEffects.push({ effectNode: aroundTablePlayerSlot.node, balance: bet });
        });

        this.aroundTablePlayersShowWinningEffect(winningEffects);
        this.updateAroundTablePlayersIncreaseBalance(balanceEffects);
    }

    showPayoutForMainPlayerNew() {
        if (this.settlementStatus?.win) {
            this.mainPlayerIncreaseBalance(this.settlementStatus?.bet);
            this.mainPlayerPlayWinningEffect();
            if (this.settlementStatus?.reachMaxWin && this.settlementStatus.reachMaxWin) {
                this.handleReachMaxWin();
            }

            this.getBalance();
            this.resetSettlementStatus();
        }
    }

    handlePlaySound(id: string) {
        if (Object.keys(this.chipStorage).length > 0) {
            this.playSound(id);
        }
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSound(id: string) {
        return id;
    }
}
