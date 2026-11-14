import { Component } from '@angular/core';
import { NotificationTypeComponent } from '../notification-type.component';

@Component({
    selector: 'release-rejected-picture',
    template: `<notification-type
        [icon]="'close'"
        [iconSize]="20"
        [iconColor]="'white'"
        [backgroundColor]="'red'"
        [size]="40"
    ></notification-type>`,
    imports: [NotificationTypeComponent],
})
export class ReleaseRejectedPictureComponent {}
