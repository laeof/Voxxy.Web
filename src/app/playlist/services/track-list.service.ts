import { Injectable } from '@angular/core';
import { BaseFilter } from '../../common/filters/base-filter';
import { EntityManagerService } from '../../common/services/entity-manager.service';
import { Track } from '../../track/models/track';

@Injectable()
export class TrackListService extends EntityManagerService<Track> {
    tracks: Track[] = [];
    constructor(filter: BaseFilter) {
        super(filter);
    }

    getPlaylistTracks() {
        this.onEntitiesLoading.next(true);
        this.onEntitiesChanged.next(this.tracks);
        this.onEntitiesLoading.next(false);
    }
}
