import { CommandIdService } from './command-id.service';

describe('CommandIdService', () => {
    it('EachUserActionGetsNewCommandId', () => {
        const service = new CommandIdService();
        expect(service.create()).not.toBe(service.create());
    });
});
