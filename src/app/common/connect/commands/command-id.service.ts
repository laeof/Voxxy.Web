import { Injectable } from '@angular/core';
import { createUuid } from '@common/helpers/uuid.helper';

@Injectable({ providedIn: 'root' })
export class CommandIdService {
    create(): string {
        return createUuid();
    }
}
