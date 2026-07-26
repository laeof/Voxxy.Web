import { BehaviorSubject } from 'rxjs';
import { ConnectStateStore } from '@common/connect/state/connect-state.store';
import {
    ConnectSnapshotResponse,
    PlayerStateDto,
    PresenceStateDto,
} from '@common/connect/transport/connect-transport.models';
import { Track } from '@features/track/models/track';
import { MediaPlayerStateService } from './media-player-state.service';
import { MediaPlayerSyncService } from './media-player-sync.service';

describe('MediaPlayerSyncService authoritative reconciliation', () => {
    it('Snapshot_LoadsMetadataAndAppliesPlayerAndOwnership', () => {
        const harness = createHarness();
        let isAudioOwner = false;
        harness.state.audioOwnerObs$.subscribe((value) => (isAudioOwner = value));

        expect(harness.store.applySnapshot(snapshot())).toBe(true);
        expect(harness.trackService.tracksBatch).toHaveBeenCalledWith(['track-1']);

        harness.trackService.entities.next([track()]);

        expect(harness.state.currentTrack?.id).toBe('track-1');
        expect(harness.state.volume).toBe(73);
        expect(harness.state.playing).toBe(true);
        expect(harness.state.position).toBe(12);
        expect(isAudioOwner).toBe(true);
    });

    it('RealtimePresenceAndReconnectSnapshot_UseTheSameProjection', () => {
        const harness = createHarness();
        let isAudioOwner = false;
        harness.state.audioOwnerObs$.subscribe((value) => (isAudioOwner = value));
        harness.store.applySnapshot(snapshot());
        harness.trackService.entities.next([track()]);

        expect(harness.store.applyPresence(presence(2, 'other-connection'))).toBe(true);
        expect(isAudioOwner).toBe(false);

        harness.hub.connectionId = 'reconnected-connection';
        expect(
            harness.store.applySnapshot(
                snapshot({
                    presence: presence(3, 'reconnected-connection'),
                }),
            ),
        ).toBe(true);

        expect(harness.state.currentTrack?.id).toBe('track-1');
        expect(harness.state.volume).toBe(73);
        expect(isAudioOwner).toBe(true);
    });

    it('PlayerAndQueueUpdates_ReconcilePlayPauseVolumePositionAndTrack', () => {
        const harness = createHarness();
        harness.store.applySnapshot(snapshot());
        harness.trackService.entities.next([track()]);

        const player: PlayerStateDto = {
            ...snapshot().player!,
            isPlaying: false,
            positionMs: 42_000,
            volumePercent: 19,
            version: 2,
        };
        expect(harness.store.applyPlayer(player)).toBe(true);

        expect(harness.state.playing).toBe(false);
        expect(harness.state.position).toBe(42);
        expect(harness.state.volume).toBe(19);
        expect(harness.state.currentTrack?.id).toBe('track-1');
    });

    it('VolumeRepeatAndPresenceUpdates_DoNotReapplyThePositionAnchor', () => {
        const harness = createHarness();
        const initial = snapshot();
        harness.store.applySnapshot(initial);
        harness.trackService.entities.next([track()]);
        harness.state.setPosition(27);

        expect(
            harness.store.applyPlayer({
                ...initial.player!,
                volumePercent: 19,
                version: 2,
            }),
        ).toBe(true);
        expect(harness.state.position).toBe(27);

        expect(
            harness.store.applyQueue({
                ...initial.queue!,
                repeatMode: 'Track',
                version: 2,
            }),
        ).toBe(true);
        expect(harness.state.position).toBe(27);

        expect(harness.store.applyPresence(presence(2, 'connection-1'))).toBe(true);
        expect(harness.state.position).toBe(27);
    });

    it('RemotePositionUpdate_ReappliesAuthoritativePosition', () => {
        const harness = createHarness();
        const initial = snapshot();
        harness.store.applySnapshot(initial);
        harness.trackService.entities.next([track()]);
        harness.state.setPosition(27);

        expect(
            harness.store.applyPlayer({
                ...initial.player!,
                positionMs: 42_000,
                positionUpdatedAt: '2026-01-01T12:01:00.000Z',
                version: 2,
            }),
        ).toBe(true);

        expect(harness.state.position).toBe(42);
    });

    it('ActiveAudioOwnerProgress_ComesFromHtmlAudioPositionProjection', () => {
        const harness = createHarness();
        let displayedPosition = -1;
        harness.service.viewPosition$.subscribe((value) => (displayedPosition = value));
        harness.store.applySnapshot(snapshot());
        harness.trackService.entities.next([track()]);

        harness.state.setPosition(31.25);

        expect(displayedPosition).toBe(31.25);
    });

    it('Play_SelectsLocalDeviceBeforePlaying_WhenNoActiveDeviceExists', async () => {
        const harness = createHarness();
        harness.store.applySnapshot(
            snapshot({
                presence: {
                    ...presence(1, 'connection-1'),
                    activeDeviceId: null,
                    audioOwnerConnectionId: null,
                },
            }),
        );

        harness.service.play();

        await vi.waitFor(() => {
            expect(harness.commands.selectDevice).toHaveBeenCalledWith('device-1');
            expect(harness.commands.play).toHaveBeenCalledOnce();
        });
        expect(harness.commands.selectDevice.mock.invocationCallOrder[0]).toBeLessThan(
            harness.commands.play.mock.invocationCallOrder[0],
        );
    });

    it('Play_DoesNotStealAnExistingActiveDevice', async () => {
        const harness = createHarness();
        harness.store.applySnapshot(snapshot());

        harness.service.play();

        await vi.waitFor(() => expect(harness.commands.play).toHaveBeenCalledOnce());
        expect(harness.commands.selectDevice).not.toHaveBeenCalled();
    });

    it('Play_ReclaimsLocalOwnershipForCurrentSignalRConnection', async () => {
        const harness = createHarness();
        harness.store.applySnapshot(
            snapshot({
                presence: presence(1, 'stale-connection'),
            }),
        );

        harness.service.play();

        await vi.waitFor(() => {
            expect(harness.commands.selectDevice).toHaveBeenCalledWith('device-1');
            expect(harness.commands.play).toHaveBeenCalledOnce();
        });
    });

    it('PlayWithTrack_SelectsTrackAndStartsPlayback', async () => {
        const harness = createHarness();
        harness.store.applySnapshot(snapshot());

        harness.service.play('track-2', 0);

        await vi.waitFor(() => expect(harness.commands.play).toHaveBeenCalledOnce());
        expect(harness.commands.addQueueItem).toHaveBeenCalledWith('track-2');
        expect(harness.commands.selectQueueItem).toHaveBeenCalledWith('queue-new');
        expect(harness.commands.changePosition).toHaveBeenCalledWith(0);
        expect(harness.commands.addQueueItem.mock.invocationCallOrder[0]).toBeLessThan(
            harness.commands.selectQueueItem.mock.invocationCallOrder[0],
        );
        expect(harness.commands.selectQueueItem.mock.invocationCallOrder[0]).toBeLessThan(
            harness.commands.play.mock.invocationCallOrder[0],
        );
    });

    it('Play_IsNotBlockedWhenAutomaticDeviceSelectionFails', async () => {
        const harness = createHarness();
        harness.store.applySnapshot(
            snapshot({
                presence: {
                    ...presence(1, 'stale-connection'),
                    activeDeviceId: null,
                    audioOwnerConnectionId: null,
                },
            }),
        );
        harness.commands.selectDevice.mockResolvedValueOnce({
            commandId: 'selection',
            status: 'DeviceOffline',
            errorCode: null,
            outcome: null,
        });

        harness.service.play();

        await vi.waitFor(() => expect(harness.commands.play).toHaveBeenCalledOnce());
    });
});

function createHarness() {
    const state = new MediaPlayerStateService();
    const store = new ConnectStateStore();
    const trackService = {
        entities: new BehaviorSubject<Track[]>([]),
        tracksBatch: vi.fn(),
        get onEntitiesChanged$() {
            return this.entities.asObservable();
        },
    };
    const hub = { connectionId: 'connection-1' };
    const applied = {
        commandId: 'command',
        status: 'Applied',
        errorCode: null,
        outcome: null,
    };
    const commands = {
        play: vi.fn(async () => applied),
        selectDevice: vi.fn(async () => applied),
        addQueueItem: vi.fn(async () => ({
            ...applied,
            outcome: { queueItemId: 'queue-new' },
        })),
        selectQueueItem: vi.fn(async () => applied),
        changePosition: vi.fn(async () => applied),
    };
    const service = new MediaPlayerSyncService(
        state,
        store,
        commands as never,
        hub as never,
        { deviceId: 'device-1' } as never,
        {} as never,
        trackService as never,
    );
    return { state, store, trackService, hub, commands, service };
}

function snapshot(
    overrides: Partial<ConnectSnapshotResponse> = {},
): ConnectSnapshotResponse {
    return {
        status: 'Applied',
        player: {
            isPlaying: true,
            positionMs: 12_000,
            positionUpdatedAt: '2026-01-01T12:00:00.000Z',
            volumePercent: 73,
            version: 1,
        },
        queue: {
            items: [{ queueItemId: 'queue-1', trackId: 'track-1', canonicalOrder: 0 }],
            currentQueueItemId: 'queue-1',
            repeatMode: 'None',
            isShuffled: false,
            version: 1,
        },
        presence: presence(1, 'connection-1'),
        serverTime: '2026-01-01T12:00:00.000Z',
        errorCode: null,
        ...overrides,
    };
}

function presence(version: number, owner: string): PresenceStateDto {
    return {
        devices: [
            {
                deviceId: 'device-1',
                name: 'Browser',
                connections: [{ connectionId: owner, connectedAt: '2026-01-01T12:00:00.000Z' }],
                isOnline: true,
            },
        ],
        activeDeviceId: 'device-1',
        audioOwnerConnectionId: owner,
        version,
    };
}

function track(): Track {
    return {
        id: 'track-1',
        name: 'Track',
        audioKey: 'audio-key',
        duration: 180,
        imageUrl: '',
        album: {} as never,
        artists: [],
    };
}
