import { Track } from '@features/track/models/track';
import { PlayButtonComponent } from './play-button.component';
import { MediaPlayerStateService } from '@common/services/media-player-state.service';

describe('PlayButtonComponent', () => {
    it('DelegatesPlaybackContextDecisionToSyncFacade', async () => {
        const store = new MediaPlayerStateService();
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
        const store = new MediaPlayerStateService();
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
        const store = new MediaPlayerStateService();
        const component = new PlayButtonComponent({} as never, store);
        component.trackListId = 'context-1';
        component.sourceType = 'Album';
        let playing = false;
        component.isCurrentContextPlaying$.subscribe((value) => (playing = value));

        applyState(store, 'context-1', 'Album', true);
        expect(playing).toBe(true);

        store.pause();
        expect(playing).toBe(false);

        store.play();
        expect(playing).toBe(true);

        applyState(store, 'context-2', 'Playlist', true);
        expect(playing).toBe(false);
    });

    it('AuthoritativeIconState_ReactsToDynamicInputsAndSourceType', () => {
        const store = new MediaPlayerStateService();
        const component = new PlayButtonComponent({} as never, store);
        component.trackListId = 'context-2';
        component.sourceType = 'Playlist';
        const values: boolean[] = [];
        component.isCurrentContextPlaying$.subscribe((value) => values.push(value));

        applyState(store, 'context-1', 'Album', true);
        component.trackListId = 'context-1';
        component.sourceType = 'Album';
        component.sourceType = 'Playlist';

        expect(values).toEqual([false, true, false]);
    });

    it('AuthoritativeIconState_DoesNotEmitForEquivalentState', () => {
        const store = new MediaPlayerStateService();
        const component = new PlayButtonComponent({} as never, store);
        component.trackListId = 'context-1';
        component.sourceType = 'Album';
        const values: boolean[] = [];
        component.isCurrentContextPlaying$.subscribe((value) => values.push(value));

        applyState(store, 'context-1', 'Album', true);
        component.trackListId = 'context-1';
        component.sourceType = 'Album';

        expect(values).toEqual([false, true]);
    });

    it('InFlightGuard_BlocksDoubleClickAndResetsAfterFailure', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const store = new MediaPlayerStateService();
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

function applyState(state: MediaPlayerStateService, sourceId: string, sourceType: 'Album' | 'Playlist', isPlaying: boolean) {
    state.applyAuthoritativeState({
        isPlaying, volumePercent: 50, queue: [], index: -1, currentTrack: null,
        repeat: state.repeat, isAudioOwner: false, sourceId, sourceType,
    });
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
