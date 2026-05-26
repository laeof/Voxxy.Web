import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Track } from '../../track/models/track';
import { Injectable } from '@angular/core';
import { ApiRoutes } from '@common/constants/api.routes.constant';
import { BaseFilter } from '@common/filters/base-filter';
import { UrlHelper } from '@common/helpers/url.helper';
import { EntityManagerService } from '@common/services/entity-manager.service';
import { environment } from '@environments/environment';

@Injectable()
export class PlaylistTrackListService extends EntityManagerService<Track> {
    constructor(baseFilter: BaseFilter, private readonly httpClient: HttpClient) {
        super(baseFilter);
    }

    getPlaylistTracks(playlistId: string): void {
        if (playlistId === '') return;

        this.onEntitiesLoading.next(true);

        const url = `${environment.apiUrl}${UrlHelper.transform(
            ApiRoutes.Playlists.getTracks,
            ':id',
            playlistId
        )}`;

        this.httpClient
            .get<Track[]>(url, {
                headers: new HttpHeaders({ 'x-skeleton-loader': 'true' }),
            })
            .subscribe((tracks: Track[]) => {
                this.onEntitiesChanged.next(tracks);
                this.onEntitiesLoading.next(false);
            });
    }
}
