import { of, throwError } from 'rxjs';
import { RepeatMode } from '@common/enums/repeat-mode.enum';
import { Track } from '@features/track/models/track';
import { MediaPlayerEngineService } from './media-player-engine.service';
import { MediaPlayerStateService } from './media-player-state.service';

describe('MediaPlayerEngineService', () => {
    let audio: FakeAudio;

    beforeEach(() => {
        audio = new FakeAudio();
        vi.stubGlobal('Audio', class {
            constructor() {
                return audio;
            }
        });
    });

    afterEach(() => vi.unstubAllGlobals());

    it('CurrentTrack_LoadsAtAuthoritativePositionAndPlaysOnlyForOwner', () => {
        const state = new MediaPlayerStateService();
        const http = { get: vi.fn(() => of('https://media/track')) };
        new MediaPlayerEngineService(state, http as never);

        apply(state, { isAudioOwner: false });

        expect(http.get).toHaveBeenCalledOnce();
        expect(audio.src).toBe('https://media/track');
        expect(audio.currentTime).toBe(33);
        expect(audio.play).not.toHaveBeenCalled();

        apply(state, { isAudioOwner: true });

        expect(http.get).toHaveBeenCalledOnce();
        expect(audio.currentTime).toBe(33);
        expect(audio.play).toHaveBeenCalledOnce();
    });

    it('FailedStreamResolution_CanBeRetried', () => {
        const state = new MediaPlayerStateService();
        const http = {
            get: vi
                .fn()
                .mockReturnValueOnce(throwError(() => new Error('unavailable')))
                .mockReturnValueOnce(of('https://media/track')),
        };
        new MediaPlayerEngineService(state, http as never);

        apply(state, { isAudioOwner: false });
        apply(state, { isAudioOwner: true });

        expect(http.get).toHaveBeenCalledTimes(2);
        expect(audio.src).toBe('https://media/track');
        expect(audio.play).toHaveBeenCalledOnce();
    });

    it('MissingCurrentTrack_ClearsAudioSource', () => {
        const state = new MediaPlayerStateService();
        new MediaPlayerEngineService(state, { get: vi.fn(() => of('url')) } as never);
        apply(state, { isAudioOwner: true });

        state.applyAuthoritativeState({
            isPlaying: false,
            positionSec: 0,
            volumePercent: 50,
            queue: [],
            index: -1,
            currentTrack: null,
            repeat: RepeatMode.None,
            isAudioOwner: false,
        });

        expect(audio.removeAttribute).toHaveBeenCalledWith('src');
        expect(audio.load).toHaveBeenCalled();
        expect(audio.pause).toHaveBeenCalled();
    });

    it('LocalUserIntent_PlaysImmediatelyForAudioOwner', () => {
        const state = new MediaPlayerStateService();
        new MediaPlayerEngineService(state, { get: vi.fn(() => of('url')) } as never);
        const currentTrack = track();
        state.applyAuthoritativeState({
            isPlaying: false,
            positionSec: 12,
            volumePercent: 50,
            queue: [currentTrack],
            index: 0,
            currentTrack,
            repeat: RepeatMode.None,
            isAudioOwner: true,
        });

        state.requestPlaybackFromUserGesture();

        expect(audio.play).toHaveBeenCalledOnce();
    });
});

function apply(
    state: MediaPlayerStateService,
    overrides: { isAudioOwner: boolean },
): void {
    const currentTrack = track();
    state.applyAuthoritativeState({
        isPlaying: true,
        positionSec: 33,
        volumePercent: 64,
        queue: [currentTrack],
        index: 0,
        currentTrack,
        repeat: RepeatMode.None,
        ...overrides,
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

class FakeAudio {
    currentTime = 0;
    paused = true;
    volume = 1;
    src = '';
    readonly play = vi.fn(async () => {
        this.paused = false;
    });
    readonly pause = vi.fn(() => {
        this.paused = true;
    });
    readonly load = vi.fn();
    readonly removeAttribute = vi.fn((name: string) => {
        if (name === 'src') this.src = '';
    });
    readonly addEventListener = vi.fn();
}
