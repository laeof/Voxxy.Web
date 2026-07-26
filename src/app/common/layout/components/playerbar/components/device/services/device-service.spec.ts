import { ConnectStateStore } from '@common/connect/state/connect-state.store';
import { DeviceService } from './device-service';

describe('DeviceService', () => {
    it('PresenceProjection_ExcludesOfflineDevices', () => {
        const store = new ConnectStateStore();
        const service = new DeviceService(store, { deviceId: 'online-device' } as never);
        let devices: ReadonlyArray<{ id: string }> = [];
        service.onEntitiesChanged$.subscribe((value) => (devices = value));

        store.applySnapshot({
            status: 'Applied',
            player: {
                isPlaying: false,
                positionMs: 0,
                positionUpdatedAt: '2026-01-01T12:00:00.000Z',
                volumePercent: 50,
                version: 1,
            },
            queue: {
                items: [],
                currentQueueItemId: null,
                repeatMode: 'None',
                isShuffled: false,
                version: 1,
            },
            presence: {
                devices: [
                    {
                        deviceId: 'online-device',
                        name: 'Online',
                        connections: [
                            {
                                connectionId: 'connection',
                                connectedAt: '2026-01-01T12:00:00.000Z',
                            },
                        ],
                        isOnline: true,
                    },
                    {
                        deviceId: 'offline-device',
                        name: 'Offline',
                        connections: [],
                        isOnline: false,
                    },
                ],
                activeDeviceId: 'online-device',
                audioOwnerConnectionId: 'connection',
                version: 1,
            },
            serverTime: '2026-01-01T12:00:00.000Z',
            errorCode: null,
        });

        expect(devices.map((device) => device.id)).toEqual(['online-device']);
    });
});
