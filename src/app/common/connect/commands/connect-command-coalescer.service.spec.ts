import { ConnectCommandCoalescer } from './connect-command-coalescer.service';

describe('ConnectCommandCoalescer', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('VolumeInput_IsCoalesced', async () => {
        const commands = { changeVolume: vi.fn().mockResolvedValue(undefined) };
        const player = { setVolume: vi.fn(), setPosition: vi.fn() };
        const coalescer = new ConnectCommandCoalescer(commands as never, player as never);

        for (let value = 0; value < 100; value++) coalescer.setVolume(value);
        await vi.advanceTimersByTimeAsync(150);

        expect(player.setVolume).toHaveBeenCalledTimes(100);
        expect(commands.changeVolume).toHaveBeenCalledOnce();
        expect(commands.changeVolume).toHaveBeenCalledWith(99);
    });

    it('SeekDrag_SendsFinalPositionOnly', () => {
        const commands = { changePosition: vi.fn() };
        const player = { setVolume: vi.fn(), setPosition: vi.fn() };
        const coalescer = new ConnectCommandCoalescer(commands as never, player as never);

        for (let position = 0; position < 100; position++) coalescer.previewSeek(position);
        coalescer.commitSeek(99);

        expect(player.setPosition).toHaveBeenCalledTimes(100);
        expect(commands.changePosition).toHaveBeenCalledOnce();
        expect(commands.changePosition).toHaveBeenCalledWith(99_000);
    });
});
