import { of, Subject, throwError } from 'rxjs';
import { RepeatMode } from '@common/enums/repeat-mode.enum';
import { Track } from '@features/track/models/track';
import { MediaPlayerEngineService } from './media-player-engine.service';
import { MediaPlayerStateService } from './media-player-state.service';
import { ConnectCommandService } from '@common/connect/commands/connect-command.service';

describe('MediaPlayerEngineService', () => {
    let audio: FakeAudio;

    beforeEach(() => {
        vi.spyOn(console, 'debug').mockImplementation(() => undefined);
        audio = new FakeAudio();
        vi.stubGlobal('Audio', class {
            constructor() {
                return audio;
            }
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

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

    it('NewSource_WaitsForMetadataThenSeeksBeforePlay', () => {
        const state = new MediaPlayerStateService();
        audio.readyState = 0;
        audio.seekable.length = 0;
        createEngine(state, { get: vi.fn(() => of('https://media/track')) });

        applyTarget(state, {
            positionSec: 49.943,
            playerVersion: 644,
            isAudioOwner: true,
        });

        expect(audio.operations).toEqual(['src', 'load']);
        expect(audio.currentTime).toBe(0);
        expect(audio.play).not.toHaveBeenCalled();

        audio.readyState = 1;
        audio.seekable.length = 1;
        audio.dispatch('loadedmetadata');

        expect(audio.operations).toEqual(['src', 'load', 'seek:49.943', 'play']);
        expect(audio.currentTime).toBe(49.943);
        expect(audio.currentTimeAtPlay).toBe(49.943);
    });

    it('RepeatedSnapshot_DoesNotReloadSameTrackOrResetPosition', () => {
        const state = new MediaPlayerStateService();
        createEngine(state, { get: vi.fn(() => of('https://media/track')) });

        applyTarget(state, {
            positionSec: 49.943,
            playerVersion: 644,
            isAudioOwner: false,
        });
        applyTarget(state, {
            positionSec: 49.943,
            playerVersion: 644,
            isAudioOwner: true,
        });
        applyTarget(state, {
            positionSec: 49.943,
            playerVersion: 644,
            isAudioOwner: true,
        });

        expect(audio.operations.filter((operation) => operation === 'src')).toHaveLength(1);
        expect(audio.operations.filter((operation) => operation === 'load')).toHaveLength(1);
        expect(audio.currentTime).toBe(49.943);
        expect(audio.currentTimeAtPlay).toBe(49.943);
    });

    it('OwnershipTransfer_ReappliesPositionBeforePlay', () => {
        const state = new MediaPlayerStateService();
        createEngine(state);
        applyTarget(state, {
            positionSec: 49.943,
            playerVersion: 644,
            isAudioOwner: false,
        });
        audio.forceCurrentTime(0);
        audio.operations.length = 0;

        applyTarget(state, {
            positionSec: 49.943,
            playerVersion: 644,
            isAudioOwner: true,
        });

        expect(audio.operations).toEqual(['seek:49.943', 'play']);
        expect(audio.currentTimeAtPlay).toBe(49.943);
    });

    it('StaleStreamUrlResponse_CannotReplaceNewerTrackGeneration', () => {
        const state = new MediaPlayerStateService();
        const firstUrl = new Subject<string>();
        const secondUrl = new Subject<string>();
        const http = {
            get: vi
                .fn()
                .mockReturnValueOnce(firstUrl)
                .mockReturnValueOnce(secondUrl),
        };
        createEngine(state, http);

        applyTarget(state, { currentTrack: track('track-a', 'audio-a') });
        applyTarget(state, { currentTrack: track('track-b', 'audio-b') });
        firstUrl.next('https://media/track-a');
        secondUrl.next('https://media/track-b');

        expect(audio.src).toBe('https://media/track-b');
        expect(audio.operations.filter((operation) => operation === 'src')).toHaveLength(1);
    });

    it('OlderPlayerVersion_CannotReplaceNewerPendingPosition', () => {
        const state = new MediaPlayerStateService();
        audio.readyState = 0;
        audio.seekable.length = 0;
        createEngine(state);

        applyTarget(state, { positionSec: 51.1, playerVersion: 645 });
        applyTarget(state, { positionSec: 49.943, playerVersion: 644 });
        audio.readyState = 1;
        audio.seekable.length = 1;
        audio.dispatch('loadedmetadata');

        expect(audio.currentTime).toBe(51.1);
        expect(audio.currentTimeAtPlay).toBe(51.1);
    });

    it('NewerPlayerVersion_ReplacesPendingPositionBeforeMetadata', () => {
        const state = new MediaPlayerStateService();
        audio.readyState = 0;
        audio.seekable.length = 0;
        createEngine(state);

        applyTarget(state, { positionSec: 49.943, playerVersion: 644 });
        applyTarget(state, { positionSec: 51.1, playerVersion: 645 });
        audio.readyState = 1;
        audio.seekable.length = 1;
        audio.dispatch('loadedmetadata');

        expect(audio.currentTime).toBe(51.1);
        expect(audio.currentTimeAtPlay).toBe(51.1);
    });

    it('AuthoritativePause_SeeksBeforePausingLoadedAudio', () => {
        const state = new MediaPlayerStateService();
        createEngine(state);
        applyTarget(state, { positionSec: 20, playerVersion: 1 });
        audio.forceCurrentTime(0);
        audio.operations.length = 0;

        applyTarget(state, {
            positionSec: 25,
            playerVersion: 2,
            isPlaying: false,
        });

        expect(audio.operations).toEqual(['seek:25', 'pause']);
        expect(audio.currentTime).toBe(25);
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

function applyTarget(
    state: MediaPlayerStateService,
    overrides: {
        currentTrack?: Track;
        positionSec?: number;
        playerVersion?: number;
        isAudioOwner?: boolean;
        isPlaying?: boolean;
    },
): void {
    const currentTrack = overrides.currentTrack ?? track();
    state.applyAuthoritativeState({
        isPlaying: overrides.isPlaying ?? true,
        positionSec: overrides.positionSec ?? 33,
        playerVersion: overrides.playerVersion ?? 1,
        volumePercent: 64,
        queue: [currentTrack],
        index: 0,
        currentTrack,
        repeat: RepeatMode.None,
        isAudioOwner: overrides.isAudioOwner ?? true,
    });
}

function track(id = 'track-1', audioKey = 'audio-key'): Track {
    return {
        id,
        name: 'Track',
        album: {} as never,
        duration: 180,
        imageUrl: '',
        artists: [],
        audioKey,
    };
}

class FakeAudio {
    private currentTimeValue = 0;
    private srcValue = '';
    paused = true;
    volume = 1;
    duration = 180;
    readyState = 1;
    networkState = 1;
    seekable = { length: 1 };
    readonly operations: string[] = [];
    currentTimeAtPlay: number | null = null;
    private readonly listeners = new Map<string, Array<() => void>>();
    readonly play = vi.fn(async () => {
        this.operations.push('play');
        this.currentTimeAtPlay = this.currentTime;
        this.paused = false;
    });
    readonly pause = vi.fn(() => {
        this.operations.push('pause');
        this.paused = true;
    });
    readonly load = vi.fn(() => {
        this.operations.push('load');
        this.currentTimeValue = 0;
    });
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

    get currentTime(): number {
        return this.currentTimeValue;
    }

    set currentTime(value: number) {
        this.operations.push(`seek:${value}`);
        this.currentTimeValue = value;
    }

    get src(): string {
        return this.srcValue;
    }

    set src(value: string) {
        this.operations.push('src');
        this.srcValue = value;
    }

    get currentSrc(): string {
        return this.srcValue;
    }

    forceCurrentTime(value: number): void {
        this.currentTimeValue = value;
    }
}
