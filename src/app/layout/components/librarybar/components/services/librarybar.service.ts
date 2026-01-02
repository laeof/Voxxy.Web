import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BaseFilter } from '../../../../../common/filters/base-filter';
import { EntityManagerService } from '../../../../../common/services/entity-manager.service';
import { LibraryDto } from '../librarybar-list/dtos/library-dto';
import { environment } from '../../../../../../environments/environment';
import { ApiRoutes } from '../../../../../common/constants/api.routes.constant';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LibraryBarService extends EntityManagerService<LibraryDto> {
    constructor(private readonly httpClient: HttpClient) {
        super(new BaseFilter());
    }

    getLibrary(): Observable<LibraryDto[]> {
        this.onEntitiesLoading.next(true);
        const url = `${environment.apiUrl}${ApiRoutes.Follows.getByUser}`;

        return this.httpClient
            .get<LibraryDto[]>(url, {
                headers: new HttpHeaders({
                    Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJkZXZlbG9wZXJzIiwiaXNzIjoiVm94eHkiLCJleHAiOjE3NjY2MTE2NjIsInN1YiI6IjQ2NWE2MTAxLTc3YzctNGY1YS04MTIxLTY1NWQxOWE1NGUwNSIsImVtYWlsIjoiYWRtaW5AYWRtaW4uY29tIiwiaWF0IjoxNzY2NjA4MDYyLCJuYmYiOjE3NjY2MDgwNjJ9.4EPo-UCPA6ILCgqRbNTwAQQBYPMRu_6w_ldKqNl1CJg`,
                }),
            })
            .pipe(
                tap((data: LibraryDto[]) => {
                    this.onEntitiesChanged.next(data);
                    this.onEntitiesLoading.next(false);
                })
            );
    }

    onSelect(selectedId: string | null | undefined): void {
        this.onEntitySelected.next(selectedId);
    }
}
