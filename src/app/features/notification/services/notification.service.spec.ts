import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of, Subject } from 'rxjs';
import { NotificationDto, NotificationPageDto } from '../models/notification';
import { NotificationService } from './notification.service';

const dto = (overrides: Partial<NotificationDto> = {}): NotificationDto => ({
    id: 'notification-1',
    type: 'FutureNotificationType',
    title: 'Title',
    description: 'Description',
    details: { arbitraryField: 'supported' },
    createdAt: '2026-11-13T10:00:00.000Z',
    readAt: null,
    ...overrides,
});

describe('NotificationService', () => {
    const page = (
        items: NotificationDto[],
        unreadCount = items.filter((item) => item.readAt === null).length,
        totalCount = items.length,
        pageNumber = 1,
        pageSize = 10,
    ): NotificationPageDto => ({
        items,
        unreadCount,
        totalCount,
        pageNumber,
        pageSize,
    });
    const createService = (overrides: Partial<HttpClient> = {}) =>
        new NotificationService({
            get: vi.fn(() => of(page([]))),
            put: vi.fn(() =>
                of({
                    notificationIds: ['notification-1'],
                    notificationId: 'notification-1',
                    readAt: '2026-11-13T11:00:00.000Z',
                }),
            ),
            ...overrides,
        } as unknown as HttpClient);

    it('UnknownNotificationType_IsStoredWithoutContractChanges', () => {
        const service = createService();

        service.applyReceived(dto());

        expect(service.notifications()[0].type).toBe('FutureNotificationType');
        expect(service.notifications()[0].details['arbitraryField']).toBe('supported');
        expect(service.hasUnreadNotifications()).toBe(true);
    });

    it('RepeatedRealtimeEvent_UpsertsById', () => {
        const service = createService();
        service.applyReceived(dto());

        service.applyReceived(dto({ title: 'Updated title' }));

        expect(service.notifications()).toHaveLength(1);
        expect(service.notifications()[0].title).toBe('Updated title');
    });

    it('ReadEvent_UpdatesUnreadComputedState', () => {
        const service = createService();
        service.applyReceived(dto());

        service.applyRead({
            notificationId: 'notification-1',
            readAt: '2026-11-13T11:00:00.000Z',
        });

        expect(service.hasUnreadNotifications()).toBe(false);
        expect(service.unreadCount()).toBe(0);
    });

    it('MarkAsRead_AppliesServerTimestamp', async () => {
        const service = createService();
        service.applyReceived(dto());

        await firstValueFrom(service.markAsRead('notification-1'));

        expect(service.notifications()[0].readAt?.toISOString()).toBe(
            '2026-11-13T11:00:00.000Z',
        );
    });

    it('RealtimeNotification_DuringHttpSync_IsNotRemovedByStalePage', async () => {
        const firstResponse = new Subject<NotificationPageDto>();
        const get = vi
            .fn()
            .mockReturnValueOnce(firstResponse)
            .mockReturnValueOnce(of(page([dto({ id: 'old-notification' })], 1)));
        const service = createService({ get } as Partial<HttpClient>);
        const synchronization = service.synchronize();

        service.applyReceived(dto({ id: 'realtime-notification' }));
        firstResponse.next(page([dto({ id: 'old-notification' })], 1));
        firstResponse.complete();
        await synchronization;

        expect(service.notifications().map((item) => item.id)).toContain(
            'realtime-notification',
        );
        expect(get).toHaveBeenCalledTimes(2);
    });

    it('RealtimeRead_DuringHttpSync_IsNotRevertedByStalePage', async () => {
        const firstResponse = new Subject<NotificationPageDto>();
        const readDto = dto({ readAt: '2026-11-13T11:00:00.000Z' });
        const get = vi
            .fn()
            .mockReturnValueOnce(firstResponse)
            .mockReturnValueOnce(of(page([readDto], 0)));
        const service = createService({ get } as Partial<HttpClient>);
        service.applyReceived(dto());
        const synchronization = service.synchronize();

        service.applyRead({
            notificationId: 'notification-1',
            readAt: readDto.readAt!,
        });
        firstResponse.next(page([dto()], 1));
        firstResponse.complete();
        await synchronization;

        expect(service.notifications()[0].readAt?.toISOString()).toBe(readDto.readAt);
        expect(service.unreadCount()).toBe(0);
    });

    it('ReadAllEvent_UpdatesEveryDeliveredNotification', () => {
        const service = createService();
        service.applyReceived(dto({ id: 'notification-1' }));
        service.applyReceived(dto({ id: 'notification-2' }));

        service.applyReadAll({
            notificationIds: ['notification-1', 'notification-2'],
            readAt: '2026-11-13T11:00:00.000Z',
        });

        expect(service.notifications().every((item) => item.readAt !== null)).toBe(true);
        expect(service.unreadCount()).toBe(0);
        expect(service.totalCount()).toBe(2);
    });

    it('LoadNextPage_AppendsOlderNotifications', async () => {
        const get = vi
            .fn()
            .mockReturnValueOnce(of(page([dto()], 2, 2, 1, 1)))
            .mockReturnValueOnce(
                of(
                    page(
                        [
                            dto({
                                id: 'notification-2',
                                createdAt: '2026-11-12T10:00:00.000Z',
                            }),
                        ],
                        2,
                        2,
                        2,
                        1,
                    ),
                ),
            );
        const service = createService({ get } as Partial<HttpClient>);

        await service.synchronize();
        await service.loadNextPage();

        expect(service.notifications().map((item) => item.id)).toEqual([
            'notification-1',
            'notification-2',
        ]);
        expect(service.hasMore()).toBe(false);
    });
});
