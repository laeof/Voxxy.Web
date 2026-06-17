import { Injectable } from '@angular/core';
import { AppRoutes } from '@common/constants/app.routes.constant';
import { Subject, BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class ReleaseCreateStateService {
    private readonly destroy$ = new Subject<void>();
    private readonly createState: BehaviorSubject<number> = new BehaviorSubject(0);
    public createState$: Observable<number> = this.createState.asObservable();

    public stateDictionary: Record<number, string> = {
        0: AppRoutes.forArtistReleasesCreateAddReleaseInformation,
        1: AppRoutes.forArtistReleasesCreateUploadTracks,
        2: AppRoutes.forArtistReleasesCreatePublish,
    };

    increaseStage(): void {
        this.createState.next(this.createState.value + 1);
    }

    decreaseStage(): void {
        this.createState.next(this.createState.value - 1);
    }

    resetState(): void {
        this.createState.next(0);
    }

    get stepByProgress(): string {
        return (
            this.stateDictionary[this.createState.value] ??
            AppRoutes.forArtistReleasesCreateAddReleaseInformation
        );
    }
}
