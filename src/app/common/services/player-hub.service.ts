import { Injectable } from '@angular/core';
import { PlayerState, PositionState } from '@common/entities/PlayerState';
import { BehaviorSubject } from 'rxjs';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { environment } from '@environments/environment';
import { ApiRoutes } from '@common/constants/api.routes.constant';
import { DeviceType } from '@common/enums/device-type.enum';
import { SignalRConstants } from '@common/constants/signalr.constant';
import { PlayRequest } from '@common/entities/PlayRequest';
import { SignalRRetryPolicy } from '@common/policies/signalr-retry.policy';
import { DeviceService } from '@common/layout/components/playerbar/components/device/services/device-service';

@Injectable({
    providedIn: 'root',
})
export class PlayerHubService {
    private connection?: HubConnection;

    private readonly playerStateSubject = new BehaviorSubject<PlayerState | null>(null);
    private readonly volumeSubject = new BehaviorSubject<number | null>(null);
    private readonly positionSubject = new BehaviorSubject<PositionState | null>(null);
    playerState$ = this.playerStateSubject.asObservable();
    volume$ = this.volumeSubject.asObservable();
    position$ = this.positionSubject.asObservable();

    constructor(private readonly deviceService: DeviceService) {}

    get isConnected(): boolean {
        return this.connection?.state === 'Connected';
    }

    get connectionId(): string | null | undefined {
        return this.connection?.connectionId;
    }

    public async connect(): Promise<void> {
        if (this.connection) return;

        this.connection = new HubConnectionBuilder()
            .withUrl(`${environment.apiUrl}${ApiRoutes.PlayerHub.hub}`)
            .withAutomaticReconnect(new SignalRRetryPolicy())
            .build();

        this.registerHandlers();

        let deviceId = this.deviceService.tryCreateDeviceId();

        this.connection.onreconnected(async () => {
            await this.registerConnection(deviceId);
        });

        await this.connection.start();

        await this.registerConnection(deviceId);
    }

    public disconnect(): void {
        this.connection?.stop();
        this.connection = undefined;
    }

    public play(request: PlayRequest): Promise<void> {
        return this.connection?.invoke(SignalRConstants.playMethod, request) ?? Promise.resolve();
    }

    public pause(request: PlayRequest): Promise<void> {
        return this.connection?.invoke(SignalRConstants.pauseMethod, request) ?? Promise.resolve();
    }

    public selectDevice(deviceId: string): Promise<void> {
        return (
            this.connection?.invoke(SignalRConstants.selectDeviceMethod, deviceId) ??
            Promise.resolve()
        );
    }

    public changePosition(request: PositionState): Promise<void> {
        return (
            this.connection?.invoke(SignalRConstants.changePositionMethod, request) ??
            Promise.resolve()
        );
    }

    public changeVolume(volume: number): Promise<void> {
        return (
            this.connection?.invoke(SignalRConstants.changeVolumeMethod, volume) ??
            Promise.resolve()
        );
    }

    private async registerConnection(deviceId: string): Promise<void> {
        await this.connection?.invoke(SignalRConstants.registerPlayerMethod);
        await this.connection?.invoke(SignalRConstants.registerQueueMethod);

        await this.connection?.invoke(SignalRConstants.registerDeviceMethod, {
            id: deviceId,
            name: `${DeviceType.Web} ${this.getBrowserName()}`,
            connectionId: this.connection?.connectionId,
        });
    }

    private registerHandlers(): void {
        this.connection?.on(SignalRConstants.playerStateChangedEvent, (state: PlayerState) => {
            this.playerStateSubject.next(state);
            console.log('playerStateChangedEvent', state);
        });
        this.connection?.on(SignalRConstants.queuePlaybackEvent, (queue) => {
            console.log('queue', queue);
        });
        this.connection?.on(SignalRConstants.activeDeviceChangedEvent, (activeDeviceId: string) => {
            this.deviceService.setActiveDeviceId(activeDeviceId);
            console.log('activeDeviceChangedEvent', activeDeviceId);
        });
        this.connection?.on(SignalRConstants.deviceListChangedEvent, (devices) => {
            this.deviceService.setDevices(devices.items);
        });
        this.connection?.on(SignalRConstants.volumeChangedEvent, (volume: number) => {
            this.volumeSubject.next(volume);
        });
        this.connection?.on(
            SignalRConstants.positionChangedEvent,
            (positionMs: number, updatedAt: string) => {
                this.positionSubject.next({ positionMs, updatedAt });
            },
        );
    }

    private getBrowserName(): string {
        const ua = navigator.userAgent;

        let os = 'Unknown OS';

        let browser = 'Unknown Browser';

        if (/Windows/i.test(ua)) os = 'Windows';
        else if (/iPhone|iPad|iPod/i.test(ua)) os = 'Iphone';
        else if (/Android/i.test(ua)) os = 'Android';
        else if (/Linux/i.test(ua)) os = 'Linux';
        else if (/Mac/i.test(ua)) os = 'Macbook';

        if (ua.includes('Edg')) browser = 'Edge';
        else if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Safari')) browser = 'Safari';

        return `${browser} (${os})`;
    }
}
