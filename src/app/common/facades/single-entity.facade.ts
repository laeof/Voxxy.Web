import { BaseEntity } from '@common/entities/BaseEntity';
import { EntityManagerService } from '@common/services/entity-manager.service';
import { map, Observable } from 'rxjs';

export class SingleEntityFacade<T extends BaseEntity> {
    entity$: Observable<T | null>;
    loading$: Observable<boolean>;

    constructor(private readonly entityManagerService: EntityManagerService<T>) {
        this.entity$ = this.entityManagerService.onEntitiesChanged$.pipe(
            map((entities) => entities[0] ?? null),
        );
        this.loading$ = this.entityManagerService.onEntitiesLoading$;
    }
}
