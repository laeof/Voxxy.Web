import { CommandIdService } from './command-id.service';

describe('CommandIdService', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('EachUserActionGetsNewCommandId', () => {
        const service = new CommandIdService();
        expect(service.create()).not.toBe(service.create());
    });

    it('CreatesCommandIdWithoutNativeRandomUuid', () => {
        let seed = 0;
        vi.stubGlobal('crypto', {
            getRandomValues: (bytes: Uint8Array) => {
                bytes.forEach((_, index) => (bytes[index] = seed + index));
                seed += bytes.length;
                return bytes;
            },
        });

        expect(new CommandIdService().create()).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
        );
    });
});
