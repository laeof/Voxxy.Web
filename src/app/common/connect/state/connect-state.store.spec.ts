import { ConnectStateStore } from './connect-state.store';
import {
    ConnectSnapshotResponse,
    PlayerStateDto,
    PresenceStateDto,
    QueueStateDto,
} from '../transport/connect-transport.models';
import { firstValueFrom } from 'rxjs';

const player = (version: number, overrides: Partial<PlayerStateDto> = {}): PlayerStateDto => ({
    isPlaying: false,
    positionMs: 1_000,
    positionUpdatedAt: '2026-01-01T00:00:00.000Z',
    volumePercent: 50,
    version,
    ...overrides,
});
const queue = (version: number): QueueStateDto => ({
    items: [],
    currentQueueItemId: null,
    repeatMode: 'None',
    isShuffled: false,
    version,
});
const presence = (version: number): PresenceStateDto => ({
    devices: [],
    activeDeviceId: null,
    audioOwnerConnectionId: null,
    version,
});
const snapshot = (serverTime: string): ConnectSnapshotResponse => ({
    status: 'Applied',
    player: player(1),
    queue: queue(1),
    presence: presence(1),
    serverTime,
    errorCode: null,
});

describe('ConnectStateStore', () => {
    it('NewerPlayerEvent_IsApplied', () => {
        const store = new ConnectStateStore();
        store.applyPlayer(player(1));
        expect(store.applyPlayer(player(2, { volumePercent: 80 }))).toBe(true);
        expect(store.value.player?.volumePercent).toBe(80);
    });

    it('EqualPlayerEvent_IsIgnored', () => {
        const store = new ConnectStateStore();
        store.applyPlayer(player(2));
        expect(store.applyPlayer(player(2, { volumePercent: 80 }))).toBe(false);
        expect(store.value.player?.volumePercent).toBe(50);
    });

    it('OlderPlayerEvent_IsIgnored', () => {
        const store = new ConnectStateStore();
        store.applyPlayer(player(2));
        expect(store.applyPlayer(player(1))).toBe(false);
        expect(store.value.player?.version).toBe(2);
    });

    it('PlayerQueueEvent_IsAppliedAtomically', () => {
        const store = new ConnectStateStore();
        const emissions: Array<[number | undefined, number | undefined]> = [];
        store.state$.subscribe((state) =>
            emissions.push([state.player?.version, state.queue?.version]),
        );

        store.applyPlayerQueue(player(1), queue(1));

        expect(emissions.at(-1)).toEqual([1, 1]);
        expect(emissions).not.toContainEqual([1, undefined]);
    });

    it('InconsistentCombinedEvent_IsRejected', () => {
        const store = new ConnectStateStore();
        store.applyPlayerQueue(player(2), queue(2));
        expect(store.applyPlayerQueue(player(3), queue(1))).toBe(false);
        expect(store.value.player?.version).toBe(2);
    });

    it('PausedPosition_EqualsAuthoritativePosition', async () => {
        const store = new ConnectStateStore();
        store.applyPlayer(player(1, { positionMs: 4_000 }));
        expect(await firstValueFrom(store.positionMs$)).toBe(4_000);
    });

    it('ClockOffset_IsApplied', () => {
        const store = new ConnectStateStore();
        store.applySnapshot(
            snapshot('2026-01-01T00:00:10.000Z'),
            Date.parse('2026-01-01T00:00:08Z'),
        );
        expect(store.value.clockOffsetMs).toBe(2_000);
    });
});
