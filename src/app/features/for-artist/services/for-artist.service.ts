import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiRoutes } from '@common/constants/api.routes.constant';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { ForArtist } from '../interfaces/for-artist.interface';

@Injectable({
    providedIn: 'root',
})
export class ForArtistService {
    constructor(private readonly httpClient: HttpClient) {}

    public getArtistsOnAccount(): Observable<ForArtist> {
        const url = `${environment.apiUrl}${ApiRoutes.Artists.getArtistsOnAccount}`;
        return this.httpClient.get<ForArtist>(url);
    }
}
