import { Injectable } from '@angular/core';
import {
    HubConnection,
    HubConnectionBuilder,
    HttpTransportType,
    LogLevel,
} from '@microsoft/signalr';
import { SignalRRetryPolicy } from '@common/policies/signalr-retry.policy';

@Injectable({ providedIn: 'root' })
export class ConnectHubConnectionFactory {
    create(url: string, accessTokenFactory: () => string | Promise<string>): HubConnection {
        return new HubConnectionBuilder()
            .withUrl(url, {
                accessTokenFactory,
                transport: HttpTransportType.WebSockets,
                skipNegotiation: true,
            })
            .withAutomaticReconnect(new SignalRRetryPolicy())
            .configureLogging(LogLevel.Warning)
            .build();
    }
}
