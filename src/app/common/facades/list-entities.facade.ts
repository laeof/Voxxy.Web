import { BaseEntity } from '../entities/BaseEntity';
import { EntityManagerService } from '../services/entity-manager.service';
import { Observable, Subscription } from 'rxjs';

export abstract class ListEntitiesFacade<T extends BaseEntity> {
    dataSource$: Observable<T[]>;
    selected$: Observable<string | undefined | null>;
    loading$: Observable<boolean>;
    subscriptions: Subscription[] = [];

    constructor(
        private readonly entityManagerService: EntityManagerService<T>
    ) {
        this.dataSource$ = this.entityManagerService.onEntitiesChanged$;
        this.selected$ = this.entityManagerService.onEntitySelected$;
        this.loading$ = this.entityManagerService.onEntitiesLoading$;
    }
}
