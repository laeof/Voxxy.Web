import { Injectable } from '@angular/core';

export type ConnectTransportErrorKind =
    | 'DeliveryUnconfirmed'
    | 'AuthenticationFailed'
    | 'WebSocketUnavailable'
    | 'Disconnected'
    | 'ServerUnavailable'
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
        if (
            message.includes('connect_internal_error') ||
            message.includes('503') ||
            message.includes('Server timeout')
        ) {
            return { kind: 'ServerUnavailable', code: 'connect_server_unavailable' };
        }

        return { kind: 'Unexpected', code: 'connect_unexpected_error' };
    }
}
