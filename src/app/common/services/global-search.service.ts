import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiRoutes } from '@common/constants/api.routes.constant';
import { environment } from '@environments/environment';
import { BehaviorSubject } from 'rxjs';
import { EntityManagerService } from './entity-manager.service';
import { BaseFilter } from '@common/filters/base-filter';
import { GlobalSearchResult } from '@common/entities/GlobalSearchResult';
import { Result } from '@common/entities/Result';

@Injectable({
    providedIn: 'root',
})
export class GlobalSearchService extends EntityManagerService<GlobalSearchResult> {

    private readonly searchQuerySubject = new BehaviorSubject<string>('');

    constructor(private readonly httpClient: HttpClient) {
        super(new BaseFilter());
    }

    setSearchQuery(query: string): void {
        this.searchQuerySubject.next(query);
        this.search();
    }

    search(): void {
        let url = `${environment.apiUrl}${ApiRoutes.GlobalSearch.search}`;
        this.onEntitiesLoading.next(true);

        this.httpClient.get<Result<GlobalSearchResult[]>>(url, {
            params: { search: this.searchQuerySubject.getValue() },
        })
        .subscribe((results: Result<GlobalSearchResult[]>) => {
            this.onEntitiesChanged.next(results.value || []);
            this.onEntitiesLoading.next(false);
        });
    }
}
