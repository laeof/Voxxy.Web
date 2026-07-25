import { Injectable } from '@angular/core';
import { ConnectStateStore } from '../state/connect-state.store';
import { ConnectHubService } from '../transport/connect-hub.service';
import {
    ConnectCommandAck,
    RepeatModeContract,
} from '../transport/connect-transport.models';
import { CommandIdService } from './command-id.service';
import { ConnectTransportErrorMapper } from '../transport/connect-transport-error.mapper';

@Injectable({ providedIn: 'root' })
export class ConnectCommandService {
    constructor(
        private readonly hub: ConnectHubService,
        private readonly ids: CommandIdService,
        private readonly store: ConnectStateStore,
        private readonly errors: ConnectTransportErrorMapper,
    ) {}

    play(): Promise<ConnectCommandAck> {
        return this.command('Play');
    }
    pause(): Promise<ConnectCommandAck> {
        return this.command('Pause');
    }
    changePosition(positionMs: number): Promise<ConnectCommandAck> {
        return this.command('ChangePosition', { positionMs });
    }
    changeVolume(volumePercent: number): Promise<ConnectCommandAck> {
        return this.command('ChangeVolume', { volumePercent });
    }
    addQueueItem(trackId: string): Promise<ConnectCommandAck> {
        return this.command('AddQueueItem', { queueItemId: this.ids.create(), trackId });
    }
    removeQueueItem(queueItemId: string): Promise<ConnectCommandAck> {
        return this.command('RemoveQueueItem', { queueItemId });
    }
    moveQueueItem(queueItemId: string, targetIndex: number): Promise<ConnectCommandAck> {
        return this.command('MoveQueueItem', { queueItemId, targetIndex });
    }
    selectQueueItem(queueItemId: string): Promise<ConnectCommandAck> {
        return this.command('SelectQueueItem', { queueItemId });
    }
    shuffle(): Promise<ConnectCommandAck> {
        return this.command('ShuffleQueue');
    }
    unshuffle(): Promise<ConnectCommandAck> {
        return this.command('UnshuffleQueue');
    }
    changeRepeatMode(repeatMode: RepeatModeContract): Promise<ConnectCommandAck> {
        return this.command('ChangeRepeatMode', { repeatMode });
    }
    next(): Promise<ConnectCommandAck> {
        return this.command('NextQueueItem');
    }
    previous(): Promise<ConnectCommandAck> {
        return this.command('PreviousQueueItem');
    }
    selectDevice(deviceId: string): Promise<ConnectCommandAck> {
        return this.command('SelectActiveDevice', { deviceId });
    }

    private async command(
        method: string,
        payload: Record<string, unknown> = {},
    ): Promise<ConnectCommandAck> {
        const commandId = this.ids.create();
        this.store.addPending(commandId);
        try {
            const ack = await this.hub.invoke<ConnectCommandAck>(method, { commandId, ...payload });
            if (ack.status === 'Conflict' || ack.status === 'CorruptState') {
                await this.hub.refreshSnapshot();
            }
            return ack;
        } catch (error: unknown) {
            const mapped = this.errors.map(error);
            if (mapped.kind !== 'DeliveryUnconfirmed') {
                throw new Error(mapped.code);
            }

            // The authoritative mutation may already be committed. Never retry it with a new ID.
            await this.hub.recoverFromUnconfirmedDelivery(commandId);
            return {
                commandId,
                status: 'Duplicate',
                errorCode: null,
                outcome: null,
            };
        } finally {
            this.store.removePending(commandId);
        }
    }
}
