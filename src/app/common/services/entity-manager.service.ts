import { BehaviorSubject } from 'rxjs';
import { BaseEntity } from '../entities/BaseEntity';
import { BaseFilter } from '../filters/base-filter';

export class EntityManagerService<T extends BaseEntity> {
    protected readonly onEntitiesChanged = new BehaviorSubject<T[]>([]);
    protected readonly onEntitiesLoading = new BehaviorSubject<boolean>(false);
    protected readonly onEntitySelected = new BehaviorSubject<string | undefined | null>(undefined);

    readonly onEntitiesChanged$ = this.onEntitiesChanged.asObservable();
    readonly onEntitiesLoading$ = this.onEntitiesLoading.asObservable();
    readonly onEntitySelected$ = this.onEntitySelected.asObservable();
    readonly filter = new BaseFilter();

    set onEntitySelectedId(id: string | undefined | null) {
        this.onEntitySelected.next(id);
    }

    constructor(filter: BaseFilter) {
        this.filter = filter;
    }
}
