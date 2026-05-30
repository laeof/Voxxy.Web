import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LibraryDto } from '../librarybar-list/dtos/library-dto';
import { Injectable } from '@angular/core';
import { ApiRoutes } from '@common/constants/api.routes.constant';
import { BaseFilter } from '@common/filters/base-filter';
import { EntityManagerService } from '@common/services/entity-manager.service';
import { environment } from '@environments/environment';

@Injectable()
export class LibraryBarService extends EntityManagerService<LibraryDto> {
    constructor(private readonly httpClient: HttpClient) {
        super(new BaseFilter());
    }

    getLibrary(): void {
        this.onEntitiesLoading.next(true);
        const url = `${environment.apiUrl}${ApiRoutes.Follows.getByUser}`;

        this.httpClient
            .get<LibraryDto[]>(url, {
                headers: new HttpHeaders({ 'x-skeleton-loader': 'false' }),
            })
            .subscribe((data: LibraryDto[]) => {
                this.onEntitiesChanged.next(data);
                this.onEntitiesLoading.next(false);
            });
    }

    onSelect(selectedId: string | null | undefined): void {
        this.onEntitySelected.next(selectedId);
    }
}
