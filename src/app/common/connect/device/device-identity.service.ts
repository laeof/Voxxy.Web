import { Injectable } from '@angular/core';
import { createUuid } from '@common/helpers/uuid.helper';

const DEVICE_ID_KEY = 'connect.v2.deviceId';

@Injectable({ providedIn: 'root' })
export class DeviceIdentityService {
    get deviceId(): string {
        const existing = localStorage.getItem(DEVICE_ID_KEY);
        if (existing) return existing;

        const id = createUuid();
        localStorage.setItem(DEVICE_ID_KEY, id);
        return id;
    }

    get deviceName(): string {
        const userAgent = navigator.userAgent;
        const browser = userAgent.includes('Edg')
            ? 'Edge'
            : userAgent.includes('Chrome')
              ? 'Chrome'
              : userAgent.includes('Firefox')
                ? 'Firefox'
                : userAgent.includes('Safari')
                  ? 'Safari'
                  : 'Browser';
        const platform = /iPhone|iPad|iPod/i.test(userAgent)
            ? 'iOS'
            : /Android/i.test(userAgent)
              ? 'Android'
              : /Windows/i.test(userAgent)
                ? 'Windows'
                : /Mac/i.test(userAgent)
                  ? 'macOS'
                  : /Linux/i.test(userAgent)
                    ? 'Linux'
                    : 'Unknown OS';
        return `${browser} on ${platform}`;
    }
}
