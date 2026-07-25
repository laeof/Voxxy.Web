import { ConnectTransportErrorMapper } from './connect-transport-error.mapper';

describe('ConnectTransportErrorMapper', () => {
    const mapper = new ConnectTransportErrorMapper();

    it('TransportErrorMapper_MapsKnownHubCodes', () => {
        expect(mapper.map(new Error('HubException: connect_delivery_unconfirmed'))).toEqual({
            kind: 'DeliveryUnconfirmed',
            code: 'connect_delivery_unconfirmed',
        });
        expect(mapper.map(new Error('WebSocket failed to connect')).kind).toBe(
            'WebSocketUnavailable',
        );
        expect(mapper.map(new Error('401 Unauthorized')).kind).toBe('AuthenticationFailed');
    });

    it('TransportErrorMapper_DoesNotExposeRawInternalErrors', () => {
        const mapped = mapper.map(new Error('database password=secret failed'));

        expect(mapped).toEqual({ kind: 'Unexpected', code: 'connect_unexpected_error' });
        expect(mapped.code).not.toContain('secret');
    });
});
