import { CommandIdService } from './commands/command-id.service';
import { DeviceIdentityService } from './device/device-identity.service';

describe('Connect UUID fallback integration', () => {
    beforeEach(() => {
        const values = new Map<string, string>();
        vi.stubGlobal('localStorage', {
            getItem: (key: string) => values.get(key) ?? null,
            setItem: (key: string, value: string) => values.set(key, value),
        });
        let seed = 0;
        vi.stubGlobal('crypto', {
            getRandomValues: (bytes: Uint8Array) => {
                bytes.forEach((_, index) => (bytes[index] = seed + index));
                seed += bytes.length;
                return bytes;
            },
        });
    });

    afterEach(() => vi.unstubAllGlobals());

    it('CreatesDeviceAndCommandIdsWithoutNativeRandomUuid', () => {
        const deviceId = new DeviceIdentityService().deviceId;
        const commandId = new CommandIdService().create();

        expect(deviceId).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
        );
        expect(commandId).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
        );
        expect(commandId).not.toBe(deviceId);
    });
});
