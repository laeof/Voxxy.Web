import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class LoaderService {
    private readonly _loading$ = new BehaviorSubject<boolean>(false);
    readonly loading$ = this._loading$.asObservable();

    private activeRequests = 0;
    private hideTimeout?: number;

    start(): void {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }

        this.activeRequests++;

        if (this.activeRequests === 1) {
            this._loading$.next(true);
        }
    }

    stop(): void {
        this.activeRequests = Math.max(0, this.activeRequests - 1);

        if (this.activeRequests === 0) {
            this.hideTimeout = globalThis.setTimeout(() => {
                this._loading$.next(false);
            }, 300);
        }
    }

    reset(): void {
        this.activeRequests = 0;
        this._loading$.next(false);
    }
}
