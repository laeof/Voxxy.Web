import { ConnectClientTelemetry } from './connect-client-telemetry.service';

describe('ConnectClientTelemetry', () => {
    it('Telemetry_DoesNotIncludeSensitiveState', () => {
        const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
        const telemetry = new ConnectClientTelemetry();

        telemetry.emit('connect_snapshot_recovery_failed', {
            reason: 'network',
            commandId: 'secret-id',
            snapshot: { queue: ['secret'] },
            token: 'jwt',
        });

        expect(info).toHaveBeenCalledWith('[connect]', 'connect_snapshot_recovery_failed', {
            reason: 'network',
        });
        expect(telemetry.count('connect_snapshot_recovery_failed')).toBe(1);
        info.mockRestore();
    });
});
