import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CommandIdService {
    create(): string {
        return crypto.randomUUID();
    }
}
