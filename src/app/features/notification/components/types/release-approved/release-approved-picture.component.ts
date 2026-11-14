import { Component } from '@angular/core';
import { NotificationTypeComponent } from '../notification-type.component';

@Component({
    selector: 'release-approved-picture',
    template: `<notification-type
        [icon]="'check'"
        [iconColor]="'white'"
        [backgroundColor]="'green'"
        [size]="40"
    ></notification-type>`,
    imports: [NotificationTypeComponent],
})
export class ReleaseApprovedPictureComponent {}
