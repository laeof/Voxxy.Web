import { Component, computed, input } from '@angular/core';
import { MyNotification } from '@features/notification/models/notification';
import { NgComponentOutlet } from '@angular/common';
import { NotificationPresentationRegistry } from '../../services/notification-presentation-registry.service';
import { NotificationService } from '../../services/notification.service';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'notification-card',
    templateUrl: './card.component.html',
    styleUrls: ['./card.component.scss'],
    imports: [NgComponentOutlet],
})
export class NotificationCardComponent {
    readonly notification = input.required<MyNotification>();
    private readonly pendingReads = new Set<string>();

    constructor(
        private readonly presentationRegistry: NotificationPresentationRegistry,
        private readonly notifications: NotificationService,
    ) {}

    protected readonly dynamicPictureComponent = computed(() =>
        this.presentationRegistry.pictureFor(this.notification()),
    );

    protected async markAsRead(): Promise<void> {
        const notification = this.notification();
        if (notification.readAt || this.pendingReads.has(notification.id)) return;

        this.pendingReads.add(notification.id);
        try {
            await firstValueFrom(this.notifications.markAsRead(notification.id));
        } catch {
            return;
        } finally {
            this.pendingReads.delete(notification.id);
        }
    }
}
