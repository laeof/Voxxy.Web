import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ConnectTiming {
    random(): number {
        return Math.random();
    }

    heartbeatDelay(baseMs = 15_000): number {
        return Math.round(baseMs * (0.9 + this.random() * 0.2));
    }
}
