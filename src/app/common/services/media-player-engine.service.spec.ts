import { of, throwError } from 'rxjs';
import { RepeatMode } from '@common/enums/repeat-mode.enum';
import { Track } from '@features/track/models/track';
import { MediaPlayerEngineService } from './media-player-engine.service';
import { MediaPlayerStateService } from './media-player-state.service';
import { ConnectCommandService } from '@common/connect/commands/connect-command.service';

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
        createEngine(state, http);

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
        createEngine(state, http);

        apply(state, { isAudioOwner: false });
        apply(state, { isAudioOwner: true });

        expect(http.get).toHaveBeenCalledTimes(2);
        expect(audio.src).toBe('https://media/track');
        expect(audio.play).toHaveBeenCalledOnce();
    });

    it('MissingCurrentTrack_ClearsAudioSource', () => {
        const state = new MediaPlayerStateService();
        createEngine(state);
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

    it('PausedAuthoritativeState_DoesNotPlayForAudioOwner', () => {
        const state = new MediaPlayerStateService();
        createEngine(state);
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

        expect(audio.play).not.toHaveBeenCalled();
    });

    it('Ended_FromAudioOwner_SendsExactlyOneAuthoritativeCommand', async () => {
        const state = new MediaPlayerStateService();
        const commands = commandFacade();
        createEngine(state, undefined, commands);
        apply(state, { isAudioOwner: true });

        audio.duration = 180;
        audio.dispatch('ended');
        audio.dispatch('ended');
        await Promise.resolve();

        expect(commands.completeCurrentTrack).toHaveBeenCalledOnce();
        expect(commands.completeCurrentTrack).toHaveBeenCalledWith('queue-item-1', 180000);
        expect(state.position).toBe(180);
    });

    it('Ended_FromNonOwner_DoesNotSendCommand', async () => {
        const state = new MediaPlayerStateService();
        const commands = commandFacade();
        createEngine(state, undefined, commands);
        apply(state, { isAudioOwner: false });

        audio.dispatch('ended');
        await Promise.resolve();

        expect(commands.completeCurrentTrack).not.toHaveBeenCalled();
    });

    it('Ended_CommandFailure_RequestsSnapshotRecovery', async () => {
        const state = new MediaPlayerStateService();
        const commands = commandFacade();
        commands.completeCurrentTrack.mockRejectedValueOnce(new Error('unavailable'));
        createEngine(state, undefined, commands);
        apply(state, { isAudioOwner: true });

        audio.dispatch('ended');
        await Promise.resolve();
        await Promise.resolve();

        expect(commands.recoverSnapshot).toHaveBeenCalledOnce();
    });

    it('RepeatTrack_AuthoritativeResetRestartsCurrentAudio', async () => {
        const state = new MediaPlayerStateService();
        const commands = commandFacade();
        createEngine(state, undefined, commands);
        apply(state, { isAudioOwner: true });
        audio.paused = true;

        audio.dispatch('ended');
        await Promise.resolve();
        const playCallsBeforeReset = audio.play.mock.calls.length;
        state.applyAuthoritativeState({
            isPlaying: true,
            positionSec: 0,
            volumePercent: 64,
            queue: [track()],
            index: 0,
            currentTrack: track(),
            repeat: RepeatMode.One,
            isAudioOwner: true,
            currentQueueItemId: 'queue-item-1',
        });

        expect(audio.currentTime).toBe(0);
        expect(audio.play).toHaveBeenCalledTimes(playCallsBeforeReset + 1);
    });
});

function createEngine(
    state: MediaPlayerStateService,
    http = { get: vi.fn(() => of('url')) },
    commands = commandFacade(),
): MediaPlayerEngineService {
    state.applyAuthoritativeState({
        isPlaying: false,
        positionSec: 0,
        volumePercent: 50,
        queue: [],
        index: -1,
        currentTrack: null,
        repeat: RepeatMode.None,
        isAudioOwner: false,
        currentQueueItemId: 'queue-item-1',
    });
    const injector = {
        get: (token: unknown) => {
            expect(token).toBe(ConnectCommandService);
            return commands;
        },
    };
    return new MediaPlayerEngineService(state, http as never, injector as never);
}

function commandFacade() {
    return {
        completeCurrentTrack: vi.fn(async () => ({
            commandId: 'command-1',
            status: 'Applied',
            errorCode: null,
            outcome: null,
        })),
        recoverSnapshot: vi.fn(async () => undefined),
    };
}

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
    duration = 180;
    private readonly listeners = new Map<string, Array<() => void>>();
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
    readonly addEventListener = vi.fn((name: string, listener: () => void) => {
        this.listeners.set(name, [...(this.listeners.get(name) ?? []), listener]);
    });
    readonly removeEventListener = vi.fn((name: string, listener: () => void) => {
        this.listeners.set(
            name,
            (this.listeners.get(name) ?? []).filter((value) => value !== listener),
        );
    });

    dispatch(name: string): void {
        for (const listener of this.listeners.get(name) ?? []) listener();
    }
}
