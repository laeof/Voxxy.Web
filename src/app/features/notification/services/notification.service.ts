import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { ApiRoutes } from '@common/constants/api.routes.constant';
import { BaseFilter } from '@common/filters/base-filter';
import { EntityManagerService } from '@common/services/entity-manager.service';
import { environment } from '@environments/environment';
import { firstValueFrom, map, Observable, tap } from 'rxjs';
import {
    MarkNotificationAsReadResponse,
    MarkAllNotificationsAsReadResponse,
    MyNotification,
    NotificationDto,
    NotificationPageDto,
    NotificationReadEvent,
    NotificationsReadAllEvent,
} from '../models/notification';

@Injectable({
    providedIn: 'root',
})
export class NotificationService extends EntityManagerService<MyNotification> {
    private readonly notificationsState = signal<readonly MyNotification[]>([]);
    private readonly unreadCountState = signal(0);
    private readonly totalCountState = signal(0);
    private readonly currentPageState = signal(0);
    private readonly pageSizeState = signal(20);
    private readonly loadingMoreState = signal(false);
    private mutationRevision = 0;

    readonly notifications = this.notificationsState.asReadonly();
    readonly hasUnreadNotifications = computed(() => this.unreadCountState() > 0);
    readonly unreadCount = this.unreadCountState.asReadonly();
    readonly totalCount = this.totalCountState.asReadonly();
    readonly loadingMore = this.loadingMoreState.asReadonly();
    readonly hasMore = computed(
        () => this.currentPageState() * this.pageSizeState() < this.totalCountState(),
    );

    constructor(private readonly http: HttpClient) {
        super(new BaseFilter());
    }

    getMyNotifications(): void {
        void this.synchronize().catch(() => undefined);
    }

    async synchronize(): Promise<void> {
        this.onEntitiesLoading.next(true);
        try {
            for (let attempt = 0; attempt < 2; attempt++) {
                const revisionBeforeRequest = this.mutationRevision;
                const page = await this.fetchPage(1, this.pageSizeState());
                this.reconcilePage(page.items.map((item) => this.fromDto(item)));
                this.currentPageState.set(page.pageNumber);
                this.pageSizeState.set(page.pageSize);
                if (revisionBeforeRequest === this.mutationRevision) {
                    this.unreadCountState.set(page.unreadCount);
                    this.totalCountState.set(page.totalCount);
                    break;
                }
            }
        } finally {
            this.onEntitiesLoading.next(false);
        }
    }

    async loadNextPage(): Promise<void> {
        if (this.loadingMoreState() || !this.hasMore()) return;

        this.loadingMoreState.set(true);
        try {
            const revisionBeforeRequest = this.mutationRevision;
            const page = await this.fetchPage(
                this.currentPageState() + 1,
                this.pageSizeState(),
            );
            this.reconcilePage(page.items.map((item) => this.fromDto(item)));
            this.currentPageState.set(page.pageNumber);
            this.pageSizeState.set(page.pageSize);
            this.totalCountState.set(page.totalCount);
            if (revisionBeforeRequest === this.mutationRevision) {
                this.unreadCountState.set(page.unreadCount);
            }
        } finally {
            this.loadingMoreState.set(false);
        }
    }

    markAsRead(notificationId: string): Observable<Date> {
        const url = `${environment.apiUrl}${ApiRoutes.Notifications.markAsRead(notificationId)}`;
        return this.http.put<MarkNotificationAsReadResponse>(url, {}).pipe(
            map((response) => new Date(response.readAt)),
            tap((readAt) => this.applyRead({ notificationId, readAt: readAt.toISOString() })),
        );
    }

    markAllAsRead(): Observable<Date> {
        const url = `${environment.apiUrl}${ApiRoutes.Notifications.markAllAsRead}`;
        return this.http.put<MarkAllNotificationsAsReadResponse>(url, {}).pipe(
            map((response) => ({
                notificationIds: response.notificationIds,
                readAt: response.readAt,
            })),
            tap((event) => this.applyReadAll(event)),
            map((event) => new Date(event.readAt)),
        );
    }

    applyReceived(dto: NotificationDto): void {
        const incoming = this.fromDto(dto);
        const current = this.notificationsState();
        const index = current.findIndex((notification) => notification.id === incoming.id);
        const existing = index === -1 ? undefined : current[index];
        const reconciled = existing ? this.reconcileNotification(existing, incoming) : incoming;
        const updated =
            index === -1
                ? [reconciled, ...current]
                : current.map((notification) =>
                      notification.id === incoming.id ? reconciled : notification,
                  );
        if (index === -1) {
            this.totalCountState.update((count) => count + 1);
            if (reconciled.readAt === null) {
                this.unreadCountState.update((count) => count + 1);
            }
        } else if (existing?.readAt === null && reconciled.readAt !== null) {
            this.decrementUnreadCount();
        }
        this.mutationRevision++;
        this.publish(this.sort(updated));
    }

    applyRead(event: NotificationReadEvent): void {
        const readAt = new Date(event.readAt);
        if (Number.isNaN(readAt.getTime())) return;

        let changed = false;
        let wasUnread = false;
        const updated = this.notificationsState().map((notification) => {
            if (notification.id !== event.notificationId) return notification;
            changed = true;
            wasUnread = notification.readAt === null;
            return { ...notification, readAt };
        });
        if (changed) {
            if (wasUnread) this.decrementUnreadCount();
            this.mutationRevision++;
            this.publish(updated);
        }
    }

    applyReadAll(event: NotificationsReadAllEvent): void {
        const readAt = new Date(event.readAt);
        if (Number.isNaN(readAt.getTime())) return;

        const notificationIds = new Set(event.notificationIds);
        const updated = this.notificationsState().map((notification) =>
            notificationIds.has(notification.id) ? { ...notification, readAt } : notification,
        );
        this.unreadCountState.set(0);
        this.mutationRevision++;
        this.publish(updated);
    }

    clear(): void {
        this.publish([]);
        this.unreadCountState.set(0);
        this.totalCountState.set(0);
        this.currentPageState.set(0);
        this.mutationRevision++;
        this.onEntitiesLoading.next(false);
    }

    private reconcilePage(notifications: readonly MyNotification[]): void {
        const merged = new Map(
            this.notificationsState().map((notification) => [notification.id, notification]),
        );
        for (const notification of notifications) {
            const existing = merged.get(notification.id);
            merged.set(
                notification.id,
                existing ? this.reconcileNotification(existing, notification) : notification,
            );
        }
        this.publish(this.sort([...merged.values()]));
    }

    private reconcileNotification(
        current: MyNotification,
        incoming: MyNotification,
    ): MyNotification {
        return {
            ...incoming,
            readAt: incoming.readAt ?? current.readAt,
        };
    }

    private decrementUnreadCount(): void {
        this.unreadCountState.update((count) => Math.max(0, count - 1));
    }

    private fetchPage(pageNumber: number, pageSize: number): Promise<NotificationPageDto> {
        const url = `${environment.apiUrl}${ApiRoutes.Notifications.getMyNotifications}`;
        const params = new HttpParams()
            .set('pageNumber', pageNumber)
            .set('pageSize', pageSize);
        return firstValueFrom(this.http.get<NotificationPageDto>(url, { params }));
    }

    private publish(notifications: readonly MyNotification[]): void {
        const next = [...notifications];
        this.notificationsState.set(next);
        this.onEntitiesChanged.next(next);
    }

    private sort(notifications: readonly MyNotification[]): MyNotification[] {
        return [...notifications].sort((left, right) => {
            const byCreatedAt = right.createdAt.getTime() - left.createdAt.getTime();
            return byCreatedAt || right.id.localeCompare(left.id);
        });
    }

    private fromDto(dto: NotificationDto): MyNotification {
        return {
            ...dto,
            type: dto.type?.trim() || 'Unknown',
            details: dto.details ?? {},
            createdAt: new Date(dto.createdAt),
            readAt: dto.readAt ? new Date(dto.readAt) : null,
        };
    }
}
