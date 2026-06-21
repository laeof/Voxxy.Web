import { Observable } from 'rxjs';
import { EntityManagerService } from './entity-manager.service';
import { BaseFilter } from '@common/filters/base-filter';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { ApiRoutes } from '@common/constants/api.routes.constant';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Following } from '@common/components/action-buttons/follow-button/models/following';

@Injectable({
    providedIn: 'root',
})
export class FollowService extends EntityManagerService<Following> {
    constructor(private readonly httpClient: HttpClient) {
        super(new BaseFilter());
    }

    getFollows(): Observable<Following[]> {
        return this.onEntitiesChanged$;
    }

    follow(entity: Following): void {
        const currentFollows = this.onEntitiesChanged.getValue();
        if (!currentFollows.some((follow) => follow.followeeId === entity.id)) {
            entity.id = entity.followeeId;
        }

        const url = `${environment.apiUrl}${ApiRoutes.Follows.follow}`;
        this.httpClient
            .post<Following>(url, entity)
            .subscribe(() => this.onEntitiesChanged.next([...currentFollows, entity]));
    }

    unfollow(entityId: string): void {
        const currentFollows = this.onEntitiesChanged.getValue();

        const url = `${environment.apiUrl}${ApiRoutes.Follows.unfollow}/${entityId}`;
        this.httpClient
            .delete(url)
            .subscribe(() =>
                this.onEntitiesChanged.next(
                    currentFollows.filter((follow) => follow.id !== entityId),
                ),
            );
    }

    loadLocalUserFollows(): void {
        this.onEntitiesLoading.next(true);
        const url = `${environment.apiUrl}${ApiRoutes.Follows.getByUser}`;

        this.httpClient
            .get<Following[]>(url, {
                headers: new HttpHeaders({ 'x-skeleton-loader': 'false' }),
            })
            .subscribe((data: Following[]) => {
                this.onEntitiesChanged.next(data);
                this.onEntitiesLoading.next(false);
            });
    }
}
