import { Injectable } from '@angular/core';
import { BaseFilter } from '@common/filters/base-filter';
import { EntityManagerService } from '@common/services/entity-manager.service';
import { Track } from '../models/track';
import { environment } from '@environments/environment';
import { ApiRoutes } from '@common/constants/api.routes.constant';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
    providedIn: 'root',
})
export class TrackService extends EntityManagerService<Track> {
    constructor(private readonly httpClient: HttpClient) {
        super(new BaseFilter());
    }

    public tracksBatch(trackIds: string[]): void {
        if (trackIds.length === 0) return;

        this.onEntitiesLoading.next(true);
        const url = `${environment.apiUrl}${ApiRoutes.Track.batch}`;
        this.httpClient

            .post<Track[]>(url, {
                headers: new HttpHeaders({ 'x-skeleton-loader': 'true' }),
                trackIds: trackIds,
            })
            .subscribe((data: Track[]) => {
                this.onEntitiesChanged.next(data);
                this.onEntitiesLoading.next(false);
            });
    }
}
