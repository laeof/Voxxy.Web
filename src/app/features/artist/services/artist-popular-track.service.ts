import { BaseFilter } from '@common/filters/base-filter';
import { EntityManagerService } from '@common/services/entity-manager.service';
import { Album } from '@features/album/models/album';
import { Artist } from '../models/artist';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiRoutes } from '@common/constants/api.routes.constant';
import { environment } from '@environments/environment';
import { Injectable } from '@angular/core';

@Injectable()
export class ArtistPopularTrackService extends EntityManagerService<Album> {
    artist: Artist | null = null;

    constructor(private readonly httpClient: HttpClient) {
        super(new BaseFilter());
    }

    getPopularTracks(artistId: string): void {
        //fixme temporary solution, need to be fixed after backend changes

        this.getArtistById(artistId);
    }

    getArtistById(artistId: string): void {
        if (artistId === '') return;

        let url: string = `${environment.apiUrl}${ApiRoutes.Artists.getById.replace(':id', artistId)}`;

        this.httpClient
            .get<Artist>(url, {
                headers: new HttpHeaders({ 'x-skeleton-loader': 'true' }),
            })
            .subscribe((artist: Artist) => {
                this.artist = artist;

                // this.artist?.albums
                //     ?.filter((album) => album.tracks.length !== 0)
                //     ?.flatMap((album: Album) => {
                //         album.tracks.forEach((track) => {
                //             track.fromPlaylist = album.id;
                //             track.artists[0] = this.artist!;
                //         });
                //         this.onEntitiesChanged.next([album]);
                //     })!;
            });
    }
}
