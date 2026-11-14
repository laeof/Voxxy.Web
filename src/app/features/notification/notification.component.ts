import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslationLoaderService } from '@common/services/translation-loader.service';
import { TranslatePipe } from '@ngx-translate/core';
import { locale as english } from './i18n/en';
import { MyNotification } from './models/notification';
import { ListEntitiesFacade } from '@common/facades/list-entities.facade';
import { NotificationService } from './services/notification.service';
import { firstValueFrom, Subject } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { NotificationCardComponent } from './components/card/card.component';

@Component({
    selector: 'app-notification',
    templateUrl: './notification.component.html',
    styleUrls: ['./notification.component.scss'],
    imports: [TranslatePipe, AsyncPipe, NotificationCardComponent],
})
export class NotificationsComponent
    extends ListEntitiesFacade<MyNotification>
    implements OnDestroy
{
    private readonly destroy$ = new Subject<void>();
    protected readonly hasUnreadNotifications;
    protected readonly hasMoreNotifications;
    protected readonly loadingMoreNotifications;
    protected markingAllAsRead = false;

    constructor(
        private readonly translationLoaderService: TranslationLoaderService,
        private readonly notificationService: NotificationService,
    ) {
        super(notificationService);
        this.hasUnreadNotifications = notificationService.hasUnreadNotifications;
        this.hasMoreNotifications = notificationService.hasMore;
        this.loadingMoreNotifications = notificationService.loadingMore;
        this.translationLoaderService.loadTranslations(english);
    }

    protected async markAllAsRead(): Promise<void> {
        if (!this.hasUnreadNotifications() || this.markingAllAsRead) return;
        this.markingAllAsRead = true;
        try {
            await firstValueFrom(this.notificationService.markAllAsRead());
        } catch {
            return;
        } finally {
            this.markingAllAsRead = false;
        }
    }

    protected async loadMoreNotifications(): Promise<void> {
        try {
            await this.notificationService.loadNextPage();
        } catch {
            return;
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
