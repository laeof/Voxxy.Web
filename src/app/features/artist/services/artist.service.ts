import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BaseFilter } from '@common/filters/base-filter';
import { EntityManagerService } from '@common/services/entity-manager.service';
import { Artist } from '../models/artist';
import { environment } from '@environments/environment';
import { ApiRoutes } from '@common/constants/api.routes.constant';
import { Injectable } from '@angular/core';

@Injectable()
export class ArtistService extends EntityManagerService<Artist> {
    constructor(
        baseFilter: BaseFilter,
        private readonly httpClient: HttpClient,
    ) {
        super(baseFilter);
    }
    
    getArtistById(artistId: string): void {
        if (artistId === '') return;

        this.onEntitiesLoading.next(true);

        let url: string = `${environment.apiUrl}${ApiRoutes.Artists.getById.replace(':id', artistId)}`;

        this.httpClient
            .get<Artist>(url, {
                headers: new HttpHeaders({ 'x-skeleton-loader': 'true' }),
            })
            .subscribe((artist: Artist) => {
                this.onEntitiesChanged.next([artist]);
                this.onEntitiesLoading.next(false);
            });
    }
}
