import { Component, input } from "@angular/core";
import { MatIcon } from "@angular/material/icon";

@Component({
    selector: 'notification-type',
    templateUrl: './notification-type.component.html',
    imports: [MatIcon]
})
export class NotificationTypeComponent {
    icon = input.required<string>();
    iconSize = input<number>(24);
    iconColor = input.required<string>();
    backgroundColor = input.required<string>();
    size = input.required<number>();
}