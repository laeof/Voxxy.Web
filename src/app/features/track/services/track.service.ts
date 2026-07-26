import { Injectable } from '@angular/core';
import { BaseFilter } from '@common/filters/base-filter';
import { EntityManagerService } from '@common/services/entity-manager.service';
import { Track } from '../models/track';
import { environment } from '@environments/environment';
import { ApiRoutes } from '@common/constants/api.routes.constant';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { finalize } from 'rxjs';

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

            .post<Track[]>(
                url,
                { trackIds },
                { headers: new HttpHeaders({ 'x-skeleton-loader': 'true' }) },
            )
            .pipe(finalize(() => this.onEntitiesLoading.next(false)))
            .subscribe({
                next: (data: Track[]) => {
                    this.onEntitiesChanged.next(data);
                },
                error: (error: unknown) => {
                    console.warn('[Connect v2] queue track metadata load failed', {
                        trackIds,
                        error,
                    });
                },
            });
    }
}
