import { Component } from '@angular/core';
import { MyNotification } from '../models/notification';
import { NotificationPresentationRegistry } from './notification-presentation-registry.service';

@Component({ template: '' })
class FutureNotificationPictureComponent {}

const notification = (type: string): MyNotification => ({
    id: 'notification-1',
    type,
    title: 'Title',
    description: 'Description',
    details: {},
    createdAt: new Date('2026-11-13T10:00:00.000Z'),
    readAt: null,
});

describe('NotificationPresentationRegistry', () => {
    it('UnknownType_UsesFallbackWithoutRegistration', () => {
        const registry = new NotificationPresentationRegistry();

        expect(registry.pictureFor(notification('FutureType'))).toBeTruthy();
    });

    it('RegisteredFutureType_UsesFeatureComponent', () => {
        const registry = new NotificationPresentationRegistry();
        registry.registerPicture('FutureType', FutureNotificationPictureComponent);

        expect(registry.pictureFor(notification('FutureType'))).toBe(
            FutureNotificationPictureComponent,
        );
    });
});
