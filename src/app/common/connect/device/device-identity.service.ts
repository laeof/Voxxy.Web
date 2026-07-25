import { Injectable } from '@angular/core';

const DEVICE_ID_KEY = 'connect.v2.deviceId';

@Injectable({ providedIn: 'root' })
export class DeviceIdentityService {
    get deviceId(): string {
        const existing = localStorage.getItem(DEVICE_ID_KEY);
        if (existing) return existing;

        const id = this.createUuid();
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

    private createUuid(): string {
        if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();

        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
        return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex
            .slice(6, 8)
            .join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
    }
}
