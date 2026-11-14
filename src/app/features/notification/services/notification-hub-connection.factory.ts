import { Injectable } from '@angular/core';
import { SignalRRetryPolicy } from '@common/policies/signalr-retry.policy';
import {
    HubConnection,
    HubConnectionBuilder,
    HttpTransportType,
    LogLevel,
} from '@microsoft/signalr';

@Injectable({ providedIn: 'root' })
export class NotificationHubConnectionFactory {
    create(url: string): HubConnection {
        return new HubConnectionBuilder()
            .withUrl(url, {
                accessTokenFactory: () => '',
                transport: HttpTransportType.WebSockets,
                skipNegotiation: true,
            })
            .withAutomaticReconnect(new SignalRRetryPolicy())
            .configureLogging(LogLevel.Warning)
            .build();
    }
}
