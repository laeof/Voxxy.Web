import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { Device } from './interfaces/device';
import { ListEntitiesFacade } from '@common/facades/list-entities.facade';
import { DeviceService } from './services/device-service';
import { AsyncPipe } from '@angular/common';
import { DeviceCardComponent } from '../device-card/device-card.component';
import { TranslatePipe } from '@ngx-translate/core';
import { PlayerHubService } from '@common/services/player-hub.service';

@Component({
    selector: 'playerbar-device',
    templateUrl: './device.component.html',
    styleUrls: ['./device.component.scss'],
    imports: [MatIcon, MatMenu, AsyncPipe, DeviceCardComponent, MatMenuTrigger, TranslatePipe],
})
export class DeviceComponent extends ListEntitiesFacade<Device> {
    constructor(private readonly deviceService: DeviceService,
        private readonly playerHubService: PlayerHubService
    ) {
        super(deviceService);

        this.deviceService.onEntitySelected$.subscribe((selectedId) => {

        });

        this.deviceService.onEntitiesChanged$.subscribe((devices) => {
            console.log('Devices list updated:', devices);
        });
    }

    selectDevice(device: Device) {
        this.playerHubService.selectDevice(device.connectionId);
    }
}
