import { Injectable } from '@angular/core';
import { BaseFilter } from '@common/filters/base-filter';
import { EntityManagerService } from '@common/services/entity-manager.service';
import { HttpClient } from '@angular/common/http';
import { Track } from '@features/track/models/track';

@Injectable()
export class TrackListService extends EntityManagerService<Track> {
    constructor(filter: BaseFilter, private readonly httpClient: HttpClient) {
        super(filter);
    }
}
