import { createUuid } from './uuid.helper';

const UUID_V4_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('createUuid', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('UsesNativeRandomUuidWhenAvailable', () => {
        const randomUUID = vi.fn(() => '11111111-1111-4111-8111-111111111111');
        vi.stubGlobal('crypto', {
            randomUUID,
            getRandomValues: vi.fn(),
        });

        expect(createUuid()).toBe('11111111-1111-4111-8111-111111111111');
        expect(randomUUID).toHaveBeenCalledOnce();
    });

    it('UsesGetRandomValuesWhenRandomUuidIsUnavailable', () => {
        let seed = 0;
        const getRandomValues = vi.fn((bytes: Uint8Array) => {
            for (let index = 0; index < bytes.length; index++) {
                bytes[index] = seed++;
            }
            return bytes;
        });
        vi.stubGlobal('crypto', { getRandomValues });

        const first = createUuid();
        const second = createUuid();

        expect(first).toMatch(UUID_V4_PATTERN);
        expect(second).toMatch(UUID_V4_PATTERN);
        expect(second).not.toBe(first);
        expect(getRandomValues).toHaveBeenCalledTimes(2);
    });

    it('ThrowsControlledErrorWhenCryptoIsUnavailable', () => {
        vi.stubGlobal('crypto', undefined);

        expect(() => createUuid()).toThrow(
            'Cryptographically secure UUID generation is unavailable in this browser.',
        );
    });
});
