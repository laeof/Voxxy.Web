import { Injectable } from '@angular/core';

export type ConnectTelemetryEvent =
    | 'connect_transport_connected'
    | 'connect_transport_reconnecting'
    | 'connect_transport_disconnected'
    | 'connect_snapshot_recovery_started'
    | 'connect_snapshot_recovery_succeeded'
    | 'connect_snapshot_recovery_failed'
    | 'connect_delivery_unconfirmed';

@Injectable({ providedIn: 'root' })
export class ConnectClientTelemetry {
    emit(event: ConnectTelemetryEvent, properties: Readonly<Record<string, unknown>> = {}): void {
        console.info('[connect]', event, properties);
    }
}
