import { Component, Input } from "@angular/core";
import { Device } from "../device/interfaces/device";
import { MatIcon } from "@angular/material/icon";
import { NgClass } from "@angular/common";

@Component({
    selector: 'playerbar-device-card',
    templateUrl: './device-card.component.html',
    styleUrls: ['./device-card.component.scss'],
    imports: [MatIcon, NgClass]
})
export class DeviceCardComponent {
    @Input() device!: Device;
    @Input() activeDeviceConnectionId!: string | null | undefined;
}