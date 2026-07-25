import { ConnectStateStore } from '../state/connect-state.store';
import { ConnectEventApplierService } from './connect-event-applier.service';

describe('ConnectEventApplierService', () => {
    it('VersionGap_TriggersSnapshotRecovery', async () => {
        const store = new ConnectStateStore();
        const applier = new ConnectEventApplierService(store);
        const recover = vi.fn().mockResolvedValue(undefined);
        applier.setSnapshotRecovery(recover);
        applier.applyPlayerEvent({ commandId: crypto.randomUUID(), player: player(3) });
        applier.applyPlayerEvent({ commandId: crypto.randomUUID(), player: player(5) });

        expect(store.value.player?.version).toBe(5);
        expect(recover).toHaveBeenCalledOnce();
    });

    it('PlayerPresenceEvent_UpdatesOwnershipAfterBothStates', () => {
        const store = new ConnectStateStore();
        const applier = new ConnectEventApplierService(store);
        const states: Array<[number | undefined, number | undefined]> = [];
        store.state$.subscribe((state) =>
            states.push([state.player?.version, state.presence?.version]),
        );

        applier.applyPlayerPresenceEvent({
            commandId: crypto.randomUUID(),
            player: player(1),
            presence: {
                devices: [],
                activeDeviceId: crypto.randomUUID(),
                audioOwnerConnectionId: 'connection',
                version: 1,
            },
        });

        expect(states.at(-1)).toEqual([1, 1]);
        expect(states).not.toContainEqual([1, undefined]);
    });

    it('InconsistentCombinedEvent_TriggersSnapshot', () => {
        const store = new ConnectStateStore();
        const applier = new ConnectEventApplierService(store);
        const recover = vi.fn().mockResolvedValue(undefined);
        applier.setSnapshotRecovery(recover);
        applier.applyPlayerQueueEvent({
            commandId: crypto.randomUUID(),
            player: player(2),
            queue: queue(2),
        });
        applier.applyPlayerQueueEvent({
            commandId: crypto.randomUUID(),
            player: player(3),
            queue: queue(1),
        });

        expect(recover).toHaveBeenCalledOnce();
        expect(store.value.player?.version).toBe(2);
        expect(store.value.queue?.version).toBe(2);
    });
});

function player(version: number) {
    return {
        isPlaying: false,
        positionMs: 0,
        positionUpdatedAt: '2026-01-01T00:00:00Z',
        volumePercent: 50,
        version,
    };
}

function queue(version: number) {
    return {
        items: [],
        currentQueueItemId: null,
        repeatMode: 'None' as const,
        isShuffled: false,
        version,
    };
}
