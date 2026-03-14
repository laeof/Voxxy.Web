import { Injectable, Input } from '@angular/core';
import { EntityManagerService } from '../../common/services/entity-manager.service';
import { Playlist } from '../models/playlist';
import { BaseFilter } from '../../common/filters/base-filter';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiRoutes } from '../../common/constants/api.routes.constant';
import { UrlHelper } from '../../common/helpers/url.helper';

@Injectable()
export class PlaylistService extends EntityManagerService<Playlist> {
    constructor(filter: BaseFilter, private readonly httpClient: HttpClient) {
        super(filter);
    }

    getPlaylistById(id: string): void {
        if (id === '') return;

        this.onEntitiesLoading.next(true);
        const url = `${environment.apiUrl}${UrlHelper.transform(
            ApiRoutes.Playlists.getById,
            ':id',
            id
        )}`;

        this.httpClient
            .get<Playlist>(url, {
                headers: new HttpHeaders({ 'x-skeleton-loader': 'true' }),
            })
            .subscribe((data: Playlist) => {
                this.onEntitiesChanged.next([data]);
                this.onEntitiesLoading.next(false);
            });
    }
}
