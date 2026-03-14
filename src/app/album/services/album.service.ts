import { Injectable } from '@angular/core';
import { EntityManagerService } from '../../common/services/entity-manager.service';
import { Album } from '../models/album';
import { BaseFilter } from '../../common/filters/base-filter';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiRoutes } from '../../common/constants/api.routes.constant';
import { environment } from '../../../environments/environment';

@Injectable()
export class AlbumService extends EntityManagerService<Album> {
    constructor(baseFilter: BaseFilter, private readonly httpClient: HttpClient) {
        super(baseFilter);
    }

    getAlbumById(id: string): void {
        if (id === '') return;

        this.onEntitiesLoading.next(true);

        let url: string = `${environment.apiUrl}${ApiRoutes.Albums.getById.replace(':id', id)}`;

        this.httpClient
            .get<Album>(url, {
                headers: new HttpHeaders({ 'x-skeleton-loader': 'true' }),
            })
            .subscribe((album: Album) => {
                this.onEntitiesChanged.next([album]);
                this.onEntitiesLoading.next(false);
            });
    }
}
