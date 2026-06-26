import { Injectable } from '@angular/core';
import { PlayerState } from '@common/entities/PlayerState';
import { BehaviorSubject } from 'rxjs';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { environment } from '@environments/environment';
import { ApiRoutes } from '@common/constants/api.routes.constant';
import { DeviceType } from '@common/enums/device-type.enum';
import { SignalRConstants } from '@common/constants/signalr.constant';
import { PlayRequest } from '@common/entities/PlayRequest';
import { SignalRRetryPolicy } from '@common/policies/signalr-retry.policy';
import { LocalStorageService } from './local-storage.service';
import { DeviceService } from '@common/layout/components/playerbar/components/device/services/device-service';
import { MediaPlayerStateService } from '@common/services/media-player-state.service';

@Injectable({
    providedIn: 'root',
})
export class PlayerHubService {
    private connection?: HubConnection;

    private readonly playerStateSubject = new BehaviorSubject<PlayerState | null>(null);
    playerState$ = this.playerStateSubject.asObservable();

    constructor(
        private readonly localStorageService: LocalStorageService,
        private readonly deviceService: DeviceService,
        private readonly mediaPlayerStateService: MediaPlayerStateService,
    ) {}

    public async connect(): Promise<void> {
        if (this.connection) return;

        this.connection = new HubConnectionBuilder()
            .withUrl(`${environment.apiUrl}${ApiRoutes.PlayerHub.hub}`)
            .withAutomaticReconnect(new SignalRRetryPolicy())
            .build();

        this.registerHandlers();

        let deviceId = this.localStorageService.getItem('deviceId');

        if (!deviceId) this.localStorageService.setItem('deviceId', crypto.randomUUID());

        deviceId = this.localStorageService.getItem('deviceId')!;

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

    public pause(): Promise<void> {
        return this.connection?.invoke(SignalRConstants.pauseMethod) ?? Promise.resolve();
    }

    private async registerConnection(deviceId: string): Promise<void> {
        await this.connection?.invoke(SignalRConstants.registerDeviceMethod, {
            id: deviceId,
            name: `${DeviceType.Web} ${this.getBrowserName()}`,
            connectionId: this.connection?.connectionId,
        });

        await this.connection?.invoke(SignalRConstants.registerPlayerMethod);
        await this.connection?.invoke(SignalRConstants.registerQueueMethod);
    }

    private registerHandlers(): void {
        this.connection?.on(SignalRConstants.playerStateChangedEvent, (state: PlayerState) => {
            this.mediaPlayerStateService.updateState(state);
        });
        this.connection?.on(SignalRConstants.queuePlaybackEvent, (queue) => {
            console.log('queue', queue);
        });
        this.connection?.on(SignalRConstants.activeDeviceChangedEvent, (activeDeviceId: string) => {
            this.deviceService.setActiveDeviceId(activeDeviceId);
        });
        this.connection?.on(SignalRConstants.deviceListChangedEvent, (devices) => {
            this.deviceService.setDevices(devices.items);
        });
    }

    private getBrowserName(): string {
        const ua = navigator.userAgent;

        if (ua.includes('Edg')) return 'Edge';
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari')) return 'Safari';

        return 'Unknown';
    }

    public selectDevice(deviceId: string): Promise<void> {
        return (
            this.connection?.invoke(SignalRConstants.selectDeviceMethod, deviceId) ??
            Promise.resolve()
        );
    }

    public changePosition(request: PlayRequest): Promise<void> {
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
}
