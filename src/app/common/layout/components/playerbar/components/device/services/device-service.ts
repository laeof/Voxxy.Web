import { EntityManagerService } from '@common/services/entity-manager.service';
import { Device } from '../interfaces/device';
import { Injectable } from '@angular/core';
import { BaseFilter } from '@common/filters/base-filter';
import { ConnectStateStore } from '@common/connect/state/connect-state.store';
import { DeviceIdentityService } from '@common/connect/device/device-identity.service';

@Injectable({
    providedIn: 'root',
})
export class DeviceService extends EntityManagerService<Device> {
    constructor(
        connectStore: ConnectStateStore,
        identity: DeviceIdentityService,
    ) {
        super(new BaseFilter());
        connectStore.presence$.subscribe((presence) => {
            if (!presence) return;
            this.setDevices(
                presence.devices
                    .filter((device) => device.isOnline)
                    .map((device) => ({
                        id: device.deviceId,
                        name: device.name,
                        isOnline: true,
                        isActive: device.deviceId === presence.activeDeviceId,
                        isLocal: device.deviceId === identity.deviceId,
                    })),
            );
            this.setActiveDeviceId(presence.activeDeviceId ?? '');
        });
    }

    setDevices(devices: Device[]): void {
        this.onEntitiesChanged.next(devices);
    }

    setActiveDeviceId(deviceId: string): void {
        this.onEntitySelectedId = deviceId;
    }

    get device(): string | undefined | null {
        return this.onEntitySelectedId;
    }

}
