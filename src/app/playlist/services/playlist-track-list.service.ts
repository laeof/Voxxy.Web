import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiRoutes } from '../../common/constants/api.routes.constant';
import { UrlHelper } from '../../common/helpers/url.helper';
import { EntityManagerService } from '../../common/services/entity-manager.service';
import { Track } from '../../track/models/track';
import { BaseFilter } from '../../common/filters/base-filter';
import { Injectable } from '@angular/core';

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
