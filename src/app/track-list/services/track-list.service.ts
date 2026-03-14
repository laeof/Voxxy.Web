import { Injectable } from '@angular/core';
import { BaseFilter } from '../../common/filters/base-filter';
import { EntityManagerService } from '../../common/services/entity-manager.service';
import { Track } from '../../track/models/track';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class TrackListService extends EntityManagerService<Track> {
    constructor(filter: BaseFilter, private readonly httpClient: HttpClient) {
        super(filter);
    }
}
