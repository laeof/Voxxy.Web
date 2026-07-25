import {
    HubConnectionBuilder,
    HttpTransportType,
    LogLevel,
} from '@microsoft/signalr';
import { randomUUID } from 'node:crypto';

const proxyUrl = process.env.CONNECT_PROXY_URL ?? 'http://localhost/api/hubs/connect';
const accessToken = process.env.CONNECT_ACCESS_TOKEN;
if (!accessToken) {
    throw new Error('CONNECT_ACCESS_TOKEN is required.');
}

const connection = new HubConnectionBuilder()
    .withUrl(proxyUrl, {
        transport: HttpTransportType.WebSockets,
        skipNegotiation: true,
        headers: { Cookie: `access_token=${accessToken}` },
    })
    .configureLogging(LogLevel.Warning)
    .build();

const eventReceived = new Promise((resolve) => connection.on('PlayerStateChanged', resolve));
await connection.start();
const snapshot = await connection.invoke('GetSnapshot');
if (snapshot.status !== 'Applied') {
    throw new Error(`GetSnapshot failed with status ${snapshot.status}.`);
}

await connection.invoke('ChangeVolume', {
    commandId: randomUUID(),
    volumePercent: snapshot.player?.volumePercent === 50 ? 51 : 50,
});
await Promise.race([
    eventReceived,
    new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SignalR event was not received through proxy.')), 5_000),
    ),
]);
await new Promise((resolve) => setTimeout(resolve, 16_000));
if (connection.state !== 'Connected') {
    throw new Error('WebSocket did not remain connected longer than one heartbeat interval.');
}

console.info('Connect proxy smoke passed.', {
    transport: 'WebSockets',
    snapshotStatus: snapshot.status,
    connectionId: connection.connectionId,
});
await connection.stop();
