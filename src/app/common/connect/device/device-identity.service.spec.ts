import { DeviceIdentityService } from './device-identity.service';

describe('DeviceIdentityService', () => {
    beforeEach(() => {
        const values = new Map<string, string>();
        vi.stubGlobal('localStorage', {
            getItem: (key: string) => values.get(key) ?? null,
            setItem: (key: string, value: string) => values.set(key, value),
            removeItem: (key: string) => values.delete(key),
            clear: () => values.clear(),
            key: () => null,
            length: 0,
        });
    });

    afterEach(() => vi.unstubAllGlobals());

    it('DeviceId_IsStableAcrossServiceInstances', () => {
        const first = new DeviceIdentityService().deviceId;
        const second = new DeviceIdentityService().deviceId;
        expect(second).toBe(first);
    });

    it('DeviceId_UsesFallbackWhenRandomUuidUnavailable', () => {
        vi.stubGlobal('crypto', {
            getRandomValues: (bytes: Uint8Array) => {
                bytes.forEach((_, index) => (bytes[index] = index));
                return bytes;
            },
        });

        expect(new DeviceIdentityService().deviceId).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
        );
    });

    it('Reconnect_ReusesSameDeviceId', () => {
        const identity = new DeviceIdentityService();
        expect(identity.deviceId).toBe(identity.deviceId);
    });
});
