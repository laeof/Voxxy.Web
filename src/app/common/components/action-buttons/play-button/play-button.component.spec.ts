import { RepeatMode } from '@common/enums/repeat-mode.enum';
import { MediaPlayerStateService } from '@common/services/media-player-state.service';
import { Track } from '@features/track/models/track';
import { PlayButtonComponent } from './play-button.component';

describe('PlayButtonComponent', () => {
    it('ActiveTrackInSameQueue_TogglesWithoutRecreatingOrResettingQueue', () => {
        const state = new MediaPlayerStateService();
        const sync = {
            play: vi.fn(),
            pause: vi.fn(),
        };
        const currentTrack = track();
        state.applyAuthoritativeState({
            isPlaying: false,
            positionSec: 41,
            volumePercent: 50,
            queue: [currentTrack],
            index: 0,
            currentTrack,
            repeat: RepeatMode.None,
            isAudioOwner: true,
        });
        const component = new PlayButtonComponent(state, sync as never);
        component.trackList = [{ ...currentTrack, fromPlaylist: 'playlist-1' }];
        component.trackListId = 'playlist-1';

        component.togglePlayButton();

        expect(sync.play).toHaveBeenCalledWith();
        expect(sync.pause).not.toHaveBeenCalled();
    });

    it('TrackListWithoutListId_StartsFirstTrack', () => {
        const state = new MediaPlayerStateService();
        const sync = {
            play: vi.fn(),
            pause: vi.fn(),
        };
        const component = new PlayButtonComponent(state, sync as never);
        component.trackList = [track()];
        component.trackListId = undefined;

        component.togglePlayButton();

        expect(sync.play).toHaveBeenCalledWith('track-1', 0);
        expect(sync.pause).not.toHaveBeenCalled();
    });
});

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
