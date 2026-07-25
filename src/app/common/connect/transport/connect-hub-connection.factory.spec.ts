import { HubConnectionBuilder, HttpTransportType } from '@microsoft/signalr';
import { ConnectHubConnectionFactory } from './connect-hub-connection.factory';

describe('ConnectHubConnectionFactory', () => {
    afterEach(() => vi.restoreAllMocks());

    it('HubConnection_UsesWebSocketsOnly_AndSkipsNegotiation', () => {
        const withUrl = vi.spyOn(HubConnectionBuilder.prototype, 'withUrl');
        const factory = new ConnectHubConnectionFactory();

        factory.create('http://localhost/api/hubs/connect', () => '');

        expect(withUrl).toHaveBeenCalledOnce();
        const options = withUrl.mock.calls[0][1];
        expect(options).toMatchObject({
            transport: HttpTransportType.WebSockets,
            skipNegotiation: true,
        });
    });

    it('HubConnection_UsesDynamicAccessTokenFactory', async () => {
        const withUrl = vi.spyOn(HubConnectionBuilder.prototype, 'withUrl');
        const factory = new ConnectHubConnectionFactory();
        let token = 'first';

        factory.create('http://localhost/api/hubs/connect', () => token);
        const options = withUrl.mock.calls[0][1];
        const accessTokenFactory = options?.accessTokenFactory;

        expect(await accessTokenFactory?.()).toBe('first');
        token = 'second';
        expect(await accessTokenFactory?.()).toBe('second');
    });
});
