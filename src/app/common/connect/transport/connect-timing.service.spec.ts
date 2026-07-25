import { ConnectTiming } from './connect-timing.service';

describe('ConnectTiming', () => {
    it('Heartbeat_UsesJitter', () => {
        const timing = new ConnectTiming();
        vi.spyOn(timing, 'random').mockReturnValueOnce(0).mockReturnValueOnce(1);

        expect(timing.heartbeatDelay()).toBe(13_500);
        expect(timing.heartbeatDelay()).toBe(16_500);
    });
});
