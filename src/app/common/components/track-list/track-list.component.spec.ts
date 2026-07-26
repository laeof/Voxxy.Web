import { BehaviorSubject } from 'rxjs';
import { ConnectStateStore } from '@common/connect/state/connect-state.store';
import { TrackListComponent } from './track-list.component';
import { Track } from '@features/track/models/track';

describe('TrackListComponent playback state', () => {
    it('PlaybackState_FollowsCurrentQueueItemPlayerAndContext', () => {
        const store = new ConnectStateStore();
        const component = createComponent(store);
        component.tracks = [track('track-1'), track('track-2')];
        component.sourceId = 'context-1';
        component.sourceType = 'Album';
        let playback: {
            isCurrentContext: boolean;
            currentTrackId: string | null;
            currentQueueItemId: string | null;
            currentIndex: number;
            isPlaying: boolean;
        } | null = null;
        component.playbackState$.subscribe((value) => (playback = value));

        store.applySnapshot(snapshot('context-1', 'Album', true, 'queue-1'));
        expect(playback).toMatchObject({
            isCurrentContext: true,
            currentTrackId: 'track-1',
            currentQueueItemId: 'queue-1',
            currentIndex: 0,
            isPlaying: true,
        });

        store.applyQueue({
            ...snapshot('context-2', 'Playlist', true, 'queue-1').queue!,
            version: 2,
        });
        expect(playback).toMatchObject({
            isCurrentContext: false,
            currentTrackId: null,
            currentIndex: -1,
            isPlaying: false,
        });
    });

    it('PlaybackState_ReactsToInputChangesAndRemotePlayerChanges', () => {
        const store = new ConnectStateStore();
        const component = createComponent(store);
        component.sourceId = 'context-2';
        component.sourceType = 'Album';
        const values: boolean[] = [];
        component.playbackState$.subscribe((value) => values.push(value.isPlaying));

        store.applySnapshot(snapshot('context-1', 'Album', true, 'queue-1'));
        component.sourceId = 'context-1';
        store.applyPlayer({
            ...snapshot('context-1', 'Album', false, 'queue-1').player!,
            version: 2,
        });
        store.applyPlayer({
            ...snapshot('context-1', 'Album', true, 'queue-1').player!,
            version: 3,
        });

        expect(values).toEqual([false, true, false, true]);
    });

    it('CurrentPlayingTrack_Pauses_AndCurrentPausedTrackPlays', () => {
        const store = new ConnectStateStore();
        const sync = {
            pause: vi.fn(),
            play: vi.fn(),
            playContext: vi.fn().mockResolvedValue(undefined),
        };
        const component = createComponent(store, sync);
        component.tracks = [track('track-1'), track('track-2')];
        component.sourceId = 'context-1';
        component.sourceType = 'Album';
        store.applySnapshot(snapshot('context-1', 'Album', true, 'queue-1'));

        component.togglePlayButton(component.tracks[0]);
        expect(sync.pause).toHaveBeenCalledOnce();
        expect(sync.playContext).not.toHaveBeenCalled();

        store.applyPlayer({
            ...snapshot('context-1', 'Album', false, 'queue-1').player!,
            version: 2,
        });
        component.togglePlayButton(component.tracks[0]);
        expect(sync.play).toHaveBeenCalledOnce();
    });

    it('OtherTrackOrContext_StartsSelectedContextWithoutGlobalPause', () => {
        const store = new ConnectStateStore();
        const sync = {
            pause: vi.fn(),
            play: vi.fn(),
            playContext: vi.fn().mockResolvedValue(undefined),
        };
        const component = createComponent(store, sync);
        component.tracks = [track('track-1'), track('track-2')];
        component.sourceId = 'context-1';
        component.sourceType = 'Album';
        store.applySnapshot(snapshot('context-1', 'Album', true, 'queue-1'));

        component.togglePlayButton(component.tracks[1]);
        expect(sync.playContext).toHaveBeenCalledWith(
            'context-1',
            'Album',
            component.tracks,
            1,
        );
        expect(sync.pause).not.toHaveBeenCalled();

        component.sourceId = 'context-2';
        component.togglePlayButton(component.tracks[0]);
        expect(sync.playContext).toHaveBeenLastCalledWith(
            'context-2',
            'Album',
            component.tracks,
            0,
        );
    });
});

function createComponent(
    store: ConnectStateStore,
    sync: object = { playContext: vi.fn().mockResolvedValue(undefined) },
): TrackListComponent {
    const entities = new BehaviorSubject([]);
    const selected = new BehaviorSubject<string | null>(null);
    const loading = new BehaviorSubject(false);
    const listService = {
        onEntitiesChanged$: entities.asObservable(),
        onEntitySelected$: selected.asObservable(),
        onEntitiesLoading$: loading.asObservable(),
        set onEntitySelectedId(value: string | null | undefined) {
            selected.next(value ?? null);
        },
    };
    return new TrackListComponent(
        listService as never,
        sync as never,
        { nativeElement: { contains: () => false } } as never,
        {} as never,
        store,
    );
}

function snapshot(
    sourceId: string,
    sourceType: 'Album' | 'Playlist',
    isPlaying: boolean,
    currentQueueItemId: string | null,
) {
    return {
        status: 'Applied' as const,
        player: {
            isPlaying,
            positionMs: 0,
            positionUpdatedAt: '2026-01-01T00:00:00.000Z',
            volumePercent: 50,
            version: 1,
        },
        queue: {
            items: [
                { queueItemId: 'queue-1', trackId: 'track-1', canonicalOrder: 0 },
                { queueItemId: 'queue-2', trackId: 'track-2', canonicalOrder: 1 },
            ],
            currentQueueItemId,
            repeatMode: 'None' as const,
            isShuffled: false,
            version: 1,
            sourceId,
            sourceType,
        },
        presence: {
            devices: [],
            activeDeviceId: null,
            audioOwnerConnectionId: null,
            version: 1,
        },
        serverTime: '2026-01-01T00:00:00.000Z',
        errorCode: null,
    };
}

function track(id: string): Track {
    return {
        id,
        name: id,
        album: {} as never,
        duration: 180,
        imageUrl: '',
        artists: [],
        audioKey: `${id}.mp3`,
    };
}
