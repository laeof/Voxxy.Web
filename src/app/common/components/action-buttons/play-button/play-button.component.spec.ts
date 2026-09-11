import { Track } from '@features/track/models/track';
import { PlayButtonComponent } from './play-button.component';
import { ConnectStateStore } from '@common/connect/state/connect-state.store';

describe('PlayButtonComponent', () => {
    it('DelegatesPlaybackContextDecisionToSyncFacade', async () => {
        const store = new ConnectStateStore();
        const sync = {
            playContext: vi.fn().mockResolvedValue(undefined),
        };
        const currentTrack = track();
        const component = new PlayButtonComponent(sync as never, store);
        component.trackList = [{ ...currentTrack, fromPlaylist: 'playlist-1' }];
        component.trackListId = 'playlist-1';
        component.sourceType = 'Playlist';

        component.togglePlayButton();
        await Promise.resolve();

        expect(sync.playContext).toHaveBeenCalledWith(
            'playlist-1',
            'Playlist',
            component.trackList,
        );
    });

    it('EmptyTrackList_DoesNotStartContext', () => {
        const store = new ConnectStateStore();
        const sync = {
            playContext: vi.fn(),
        };
        const component = new PlayButtonComponent(sync as never, store);
        component.trackList = [];
        component.trackListId = 'playlist-1';

        component.togglePlayButton();

        expect(sync.playContext).not.toHaveBeenCalled();
    });

    it('AuthoritativeIconState_IsPlayingOnlyForMatchingContext', () => {
        const store = new ConnectStateStore();
        const component = new PlayButtonComponent({} as never, store);
        component.trackListId = 'context-1';
        component.sourceType = 'Album';
        let playing = false;
        component.isCurrentContextPlaying$.subscribe((value) => (playing = value));

        store.applySnapshot(snapshot('context-1', 'Album', true));
        expect(playing).toBe(true);

        store.applyPlayer({
            ...snapshot('context-1', 'Album', false).player!,
            version: 2,
        });
        expect(playing).toBe(false);

        store.applyPlayer({
            ...snapshot('context-1', 'Album', true).player!,
            version: 3,
        });
        expect(playing).toBe(true);

        store.applyQueue({
            ...snapshot('context-2', 'Playlist', true).queue!,
            version: 2,
        });
        expect(playing).toBe(false);
    });

    it('AuthoritativeIconState_ReactsToDynamicInputsAndSourceType', () => {
        const store = new ConnectStateStore();
        const component = new PlayButtonComponent({} as never, store);
        component.trackListId = 'context-2';
        component.sourceType = 'Playlist';
        const values: boolean[] = [];
        component.isCurrentContextPlaying$.subscribe((value) => values.push(value));

        store.applySnapshot(snapshot('context-1', 'Album', true));
        component.trackListId = 'context-1';
        component.sourceType = 'Album';
        component.sourceType = 'Playlist';

        expect(values).toEqual([false, true, false]);
    });

    it('AuthoritativeIconState_DoesNotEmitForEquivalentState', () => {
        const store = new ConnectStateStore();
        const component = new PlayButtonComponent({} as never, store);
        component.trackListId = 'context-1';
        component.sourceType = 'Album';
        const values: boolean[] = [];
        component.isCurrentContextPlaying$.subscribe((value) => values.push(value));

        store.applySnapshot(snapshot('context-1', 'Album', true));
        component.trackListId = 'context-1';
        component.sourceType = 'Album';

        expect(values).toEqual([false, true]);
    });

    it('InFlightGuard_BlocksDoubleClickAndResetsAfterFailure', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const store = new ConnectStateStore();
        let reject!: (error: Error) => void;
        const pending = new Promise<void>((_, fail) => (reject = fail));
        const sync = { playContext: vi.fn(() => pending) };
        const component = new PlayButtonComponent(sync as never, store);
        component.trackList = [track()];
        component.trackListId = 'context-1';

        component.togglePlayButton();
        component.togglePlayButton();
        expect(sync.playContext).toHaveBeenCalledOnce();
        expect(component.inFlight).toBe(true);

        reject(new Error('connect_server_unavailable'));
        await vi.waitFor(() => expect(component.inFlight).toBe(false));
        component.togglePlayButton();
        expect(sync.playContext).toHaveBeenCalledTimes(2);
    });
});

function snapshot(sourceId: string, sourceType: 'Album' | 'Playlist', isPlaying: boolean) {
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
            items: [],
            currentQueueItemId: null,
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

function track(): Track {
    return {
        id: 'track-1',
        name: 'Track',
        album: {} as never,
        duration: 180,
        imageUrl: '',
        artists: [],
        audioKey: 'audio-key',
    };
}
