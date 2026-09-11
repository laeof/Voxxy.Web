import { Injectable } from '@angular/core';

export type ConnectTransportErrorKind =
    | 'DeliveryUnconfirmed'
    | 'AuthenticationFailed'
    | 'WebSocketUnavailable'
    | 'Disconnected'
    | 'ServerUnavailable'
    | 'ServerTimeout'
    | 'ServerRejected'
    | 'ServerInternalError'
    | 'SerializationError'
    | 'RateLimited'
    | 'Unexpected';

export interface ConnectTransportError {
    kind: ConnectTransportErrorKind;
    code: string;
}

@Injectable({ providedIn: 'root' })
export class ConnectTransportErrorMapper {
    map(error: unknown): ConnectTransportError {
        const message = error instanceof Error ? error.message : String(error ?? '');

        if (message.includes('connect_delivery_unconfirmed')) {
            return { kind: 'DeliveryUnconfirmed', code: 'connect_delivery_unconfirmed' };
        }
        if (
            message.includes('Invocation canceled due to the underlying connection being closed') ||
            message.includes('connection was stopped during negotiation') ||
            message.includes('Connection disconnected with an error')
        ) {
            return { kind: 'DeliveryUnconfirmed', code: 'connect_delivery_unconfirmed' };
        }
        if (/\b(401|403)\b/.test(message)) {
            return { kind: 'AuthenticationFailed', code: 'connect_authentication_failed' };
        }
        if (
            message.includes('WebSocket') ||
            message.includes('websocket') ||
            message.includes('Failed to start the connection')
        ) {
            return { kind: 'WebSocketUnavailable', code: 'connect_websocket_unavailable' };
        }
        if (message.includes('connect_transport_disconnected')) {
            return { kind: 'Disconnected', code: 'connect_transport_disconnected' };
        }
        if (message.includes('connect_rate_limited')) {
            return { kind: 'RateLimited', code: 'connect_rate_limited' };
        }
        if (message.includes('connect_internal_error')) {
            return { kind: 'ServerInternalError', code: 'connect_server_internal_error' };
        }
        if (message.includes('Server timeout')) {
            return { kind: 'ServerTimeout', code: 'connect_server_timeout' };
        }
        if (
            message.includes('serialization') ||
            message.includes('deserialization') ||
            message.includes('JSON')
        ) {
            return { kind: 'SerializationError', code: 'connect_serialization_error' };
        }
        if (message.includes('503')) {
            return { kind: 'ServerUnavailable', code: 'connect_server_unavailable' };
        }
        if (message.includes('HubException')) {
            return { kind: 'ServerRejected', code: 'connect_server_rejected' };
        }

        return { kind: 'Unexpected', code: 'connect_unexpected_error' };
    }
}
