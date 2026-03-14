import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EntityManagerService } from '../../common/services/entity-manager.service';
import { environment } from '../../../environments/environment';
import { ApiRoutes } from '../../common/constants/api.routes.constant';
import { BaseFilter } from '../../common/filters/base-filter';
import { UrlHelper } from '../../common/helpers/url.helper';
import { Track } from '../../track/models/track';

@Injectable()
export class AlbumTrackListService extends EntityManagerService<Track> {
    constructor(baseFilter: BaseFilter, private readonly httpClient: HttpClient) {
        super(baseFilter);
    }

    getAlbumTracks(albumId: string): void {
        if (albumId === '') return;

        this.onEntitiesLoading.next(true);

        const url = `${environment.apiUrl}${UrlHelper.transform(
            ApiRoutes.Albums.getTracks,
            ':id',
            albumId
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
