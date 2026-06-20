import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SubjectSelectOption } from '@common/components/subject-select/subject-select.component';
import { ApiRoutes } from '@common/constants/api.routes.constant';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';

@Injectable()
export class AddInformationSearchService {
    constructor(private readonly httpClient: HttpClient) {}

    searchGenre(query: string): Observable<SubjectSelectOption[]> {
        return this.httpClient.get<SubjectSelectOption[]>(
            `${environment.apiUrl}${ApiRoutes.ForArtists.searchGenres}`,
            {
                params: {
                    search: query,
                    limit: 20,
                },
            },
        );
    }

    searchMood(query: string): Observable<SubjectSelectOption[]> {
        return this.httpClient.get<SubjectSelectOption[]>(
            `${environment.apiUrl}${ApiRoutes.ForArtists.searchMoods}`,
            {
                params: {
                    search: query,
                    limit: 20,
                },
            },
        );
    }

    searchArtist(query: string): Observable<SubjectSelectOption[]> {
        return this.httpClient.get<SubjectSelectOption[]>(
            `${environment.apiUrl}${ApiRoutes.ForArtists.searchArtists}`,
            {
                params: {
                    search: query,
                    limit: 20,
                },
            },
        );
    }
}
