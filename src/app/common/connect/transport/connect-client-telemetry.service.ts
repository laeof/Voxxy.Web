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
    private readonly counts = new Map<ConnectTelemetryEvent, number>();

    emit(event: ConnectTelemetryEvent, properties: Readonly<Record<string, unknown>> = {}): void {
        this.counts.set(event, (this.counts.get(event) ?? 0) + 1);
        const safeProperties = Object.fromEntries(
            Object.entries(properties).filter(([key, value]) =>
                ['reason', 'reconnected', 'category', 'durationMs'].includes(key) &&
                ['string', 'boolean', 'number'].includes(typeof value),
            ),
        );
        console.info('[connect]', event, safeProperties);
    }

    count(event: ConnectTelemetryEvent): number {
        return this.counts.get(event) ?? 0;
    }
}
