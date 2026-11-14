import { Injectable, Type } from '@angular/core';
import { DefaultNotificationPictureComponent } from '../components/types/default/default-notification-picture.component';
import { ReleaseApprovedPictureComponent } from '../components/types/release-approved/release-approved-picture.component';
import { ReleaseRejectedPictureComponent } from '../components/types/release-rejected/release-rejected-picture.component';
import { MyNotification } from '../models/notification';

@Injectable({ providedIn: 'root' })
export class NotificationPresentationRegistry {
    private readonly pictureComponents = new Map<string, Type<unknown>>([
        ['ReleaseApproved', ReleaseApprovedPictureComponent],
        ['ReleaseRejected', ReleaseRejectedPictureComponent],
        ['release_approved', ReleaseApprovedPictureComponent],
        ['release_rejected', ReleaseRejectedPictureComponent],
    ]);

    registerPicture(type: string, component: Type<unknown>): void {
        const normalizedType = type.trim();
        if (!normalizedType) throw new Error('Notification type must not be empty.');
        this.pictureComponents.set(normalizedType, component);
    }

    pictureFor(notification: MyNotification): Type<unknown> {
        const detailsType = notification.details.$type;
        return (
            this.pictureComponents.get(notification.type) ??
            (detailsType ? this.pictureComponents.get(detailsType) : undefined) ??
            DefaultNotificationPictureComponent
        );
    }
}
