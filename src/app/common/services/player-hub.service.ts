import { Injectable } from '@angular/core';
import { ConnectCommandService } from '@common/connect/commands/connect-command.service';
import { ConnectHubService } from '@common/connect/transport/connect-hub.service';

/**
 * Compatibility façade for existing UI consumers. It delegates exclusively to Connect v2 and
 * owns no connection or authoritative state.
 */
@Injectable({ providedIn: 'root' })
export class PlayerHubService {
    constructor(
        private readonly hub: ConnectHubService,
        private readonly commands: ConnectCommandService,
    ) {}

    get isConnected(): boolean {
        return this.hub.isConnected;
    }

    get connectionId(): string | null {
        return this.hub.connectionId;
    }

    connect(): Promise<void> {
        return this.hub.connect();
    }

    disconnect(): Promise<void> {
        return this.hub.disconnectGracefully();
    }

    selectDevice(deviceId: string): Promise<void> {
        return this.commands.selectDevice(deviceId).then(() => undefined);
    }
}
