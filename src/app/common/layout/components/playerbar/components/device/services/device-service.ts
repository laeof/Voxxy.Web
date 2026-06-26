import { EntityManagerService } from "@common/services/entity-manager.service";
import { Device } from "../interfaces/device";
import { Injectable } from "@angular/core";
import { BaseFilter } from "@common/filters/base-filter";

@Injectable({
    providedIn: 'root'
})
export class DeviceService extends EntityManagerService<Device> {
    constructor() {
        super(new BaseFilter());
    }

    setDevices(devices: Device[]): void {
        this.onEntitiesChanged.next(devices);
    }

    setActiveDeviceId(deviceId: string): void {
        this.onEntitySelectedId = deviceId;
    }
}