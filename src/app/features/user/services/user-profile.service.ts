import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiRoutes } from '@common/constants/api.routes.constant';
import { BaseFilter } from '@common/filters/base-filter';
import { EntityManagerService } from '@common/services/entity-manager.service';
import { environment } from '@environments/environment';
import { User } from '@features/auth/models/user';

@Injectable({
    providedIn: 'root',
})
export class UserProfileService extends EntityManagerService<User> {
    constructor(private readonly httpClient: HttpClient) {
        super(new BaseFilter());
    }

    getUserById(userId: string): void {
        if (userId === '') return;

        this.onEntitiesLoading.next(true);

        let url: string = `${environment.apiUrl}${ApiRoutes.Users.getById.replace(':id', userId)}`;

        this.httpClient
            .get<User>(url, {
                headers: new HttpHeaders({ 'x-skeleton-loader': 'true' }),
            })
            .subscribe((user: User) => {
                this.onEntitiesChanged.next([user]);
                this.onEntitiesLoading.next(false);
            });
    }
}
