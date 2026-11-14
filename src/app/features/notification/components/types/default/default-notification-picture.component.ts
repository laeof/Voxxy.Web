import { Component } from '@angular/core';
import { NotificationTypeComponent } from '../notification-type.component';

@Component({
    selector: 'default-notification-picture',
    template: `<notification-type
        [icon]="'notifications'"
        [iconColor]="'white'"
        [backgroundColor]="'#6f5bd3'"
        [size]="40"
    ></notification-type>`,
    imports: [NotificationTypeComponent],
})
export class DefaultNotificationPictureComponent {}
