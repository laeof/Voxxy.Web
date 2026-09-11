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

    it('RateLimitedError_IsMappedSafely', () => {
        expect(mapper.map(new Error('HubException: connect_rate_limited'))).toEqual({
            kind: 'RateLimited',
            code: 'connect_rate_limited',
        });
    });

    it('ServerFailures_AreNotCollapsedIntoUnavailable', () => {
        expect(mapper.map(new Error('HubException: connect_internal_error'))).toEqual({
            kind: 'ServerInternalError',
            code: 'connect_server_internal_error',
        });
        expect(mapper.map(new Error('Server timeout while invoking'))).toEqual({
            kind: 'ServerTimeout',
            code: 'connect_server_timeout',
        });
        expect(mapper.map(new Error('HubException: connect_identity_invalid'))).toEqual({
            kind: 'ServerRejected',
            code: 'connect_server_rejected',
        });
        expect(mapper.map(new Error('503 Service Unavailable'))).toEqual({
            kind: 'ServerUnavailable',
            code: 'connect_server_unavailable',
        });
        expect(mapper.map(new Error('JSON deserialization failed'))).toEqual({
            kind: 'SerializationError',
            code: 'connect_serialization_error',
        });
    });

    it('DisconnectDuringInvoke_IsDeliveryUnconfirmed', () => {
        expect(
            mapper.map(
                new Error(
                    'Invocation canceled due to the underlying connection being closed.',
                ),
            ),
        ).toEqual({
            kind: 'DeliveryUnconfirmed',
            code: 'connect_delivery_unconfirmed',
        });
    });
});
