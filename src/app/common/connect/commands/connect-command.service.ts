import { Injectable } from '@angular/core';
import { ConnectStateStore } from '../state/connect-state.store';
import { ConnectHubService } from '../transport/connect-hub.service';
import {
    ConnectCommandAck,
    PlaybackSourceTypeContract,
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
    completeCurrentTrack(
        expectedQueueItemId: string,
        completedPositionMs: number,
    ): Promise<ConnectCommandAck> {
        return this.command('CompleteCurrentTrack', {
            expectedQueueItemId,
            completedPositionMs,
        });
    }
    startPlaybackContext(
        sourceId: string,
        sourceType: PlaybackSourceTypeContract,
        items: ReadonlyArray<{ queueItemId: string; trackId: string }>,
        startIndex?: number,
    ): Promise<ConnectCommandAck> {
        return this.command('StartPlaybackContext', {
            sourceId,
            sourceType,
            items,
            startIndex: startIndex ?? null,
        });
    }
    previous(): Promise<ConnectCommandAck> {
        return this.command('PreviousQueueItem');
    }
    selectDevice(deviceId: string): Promise<ConnectCommandAck> {
        return this.command('SelectActiveDevice', { deviceId });
    }

    recoverSnapshot(): Promise<void> {
        return this.hub.refreshSnapshot();
    }

    private async command(
        method: string,
        payload: Record<string, unknown> = {},
    ): Promise<ConnectCommandAck> {
        const commandId = this.ids.create();
        if (method === 'StartPlaybackContext') {
            const items =
                (payload['items'] as
                    | ReadonlyArray<{ queueItemId: string; trackId: string }>
                    | undefined) ?? [];
            const startIndex = payload['startIndex'] as number | null | undefined;
            const startItem =
                startIndex !== null && startIndex !== undefined
                    ? items[startIndex]
                    : items[0];
            console.debug('[Connect v2] StartPlaybackContext payload', {
                commandId,
                sourceId: payload['sourceId'],
                sourceType: payload['sourceType'],
                startIndex: startIndex ?? null,
                startTrackId: startItem?.trackId ?? null,
                startQueueItemId: startItem?.queueItemId ?? null,
                itemCount: items.length,
                items: items.map((item, index) => ({ index, ...item })),
            });
        }
        try {
            await this.hub.waitUntilReady();
        } catch (error: unknown) {
            console.error('[Connect v2] command rejected before invocation', {
                commandName: method,
                commandId,
                ...this.hub.diagnosticState,
                reason: error instanceof Error ? error.message : 'unknown',
            });
            throw error;
        }

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
                const original = this.describeOriginalError(error);
                console.error('[Connect v2] command invocation failed', {
                    commandName: method,
                    commandId,
                    ...this.hub.diagnosticState,
                    transportErrorKind: mapped.kind,
                    transportErrorCode: mapped.code,
                    ...original,
                });
                throw new Error(mapped.code, { cause: error });
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

    private describeOriginalError(error: unknown): Record<string, unknown> {
        if (error instanceof Error) {
            const details = error as Error & {
                error?: unknown;
                status?: unknown;
                statusCode?: unknown;
            };
            return {
                originalErrorType: error.constructor.name,
                originalErrorName: error.name,
                originalErrorMessage: error.message,
                originalErrorStack: error.stack,
                originalErrorCause: error.cause,
                originalInnerError: details.error,
                originalStatusCode: details.statusCode ?? details.status,
            };
        }

        return {
            originalErrorType: typeof error,
            originalErrorMessage: String(error ?? ''),
        };
    }
}
