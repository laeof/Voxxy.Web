import { EntityManagerService } from '@common/services/entity-manager.service';
import { Device } from '../interfaces/device';
import { Injectable } from '@angular/core';
import { BaseFilter } from '@common/filters/base-filter';
import { LocalStorageService } from '@common/services/local-storage.service';

@Injectable({
    providedIn: 'root',
})
export class DeviceService extends EntityManagerService<Device> {
    constructor(private readonly localStorageService: LocalStorageService) {
        super(new BaseFilter());
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

    public tryCreateDeviceId(): string {
        let deviceId = this.localStorageService.getItem('deviceId');

        if (!deviceId) {
            if (crypto.randomUUID) {
                deviceId = crypto.randomUUID();
            } else {
                deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                    const r = Math.trunc(Math.random() * 16);
                    const v = c === 'x' ? r : (r & 0x3) | 0x8;
                    return v.toString(16);
                });
            }

            this.localStorageService.setItem('deviceId', deviceId);
        }

        return deviceId;
    }
}
