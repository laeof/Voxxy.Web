import { Injectable } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { AppRoutes } from '@common/constants/app.routes.constant';
import { BehaviorSubject, filter, Observable } from 'rxjs';

@Injectable()
export class ReleaseCreateService {
    private readonly createState: BehaviorSubject<number> = new BehaviorSubject(0);
    public createState$: Observable<number> = this.createState.asObservable();

    constructor(
        private readonly router: Router,
        private readonly activatedRoute: ActivatedRoute,
    ) {
        this.upadteFlowState();

        this.router.events
            .pipe(filter((event) => event instanceof NavigationEnd))
            .subscribe(() => this.upadteFlowState());
    }

    increaseStage(): void {
        this.createState.next(this.createState.value + 1);
        this.navigateTo(this.stepByProgress);
    }

    decreaseStage(): void {
        this.createState.next(this.createState.value - 1);
        this.navigateTo(this.stepByProgress);
    }

    private upadteFlowState(): void {
        let route = this.activatedRoute.root;

        while (route.firstChild) {
            route = route.firstChild;
        }

        const path = route.snapshot.routeConfig?.path;

        this.createState.next(this.getCreateState(path));
    }

    private getCreateState(path: string | undefined): number {
        switch (path) {
            case AppRoutes.forArtistReleasesCreateAddReleaseInformation:
                return 0;
            case AppRoutes.forArtistReleasesCreateUploadTracks:
                return 1;
            case AppRoutes.forArtistReleasesCreatePublish:
                return 2;
            default:
                return 0;
        }
    }

    get stepByProgress(): string {
        switch (this.createState.value) {
            case 0:
                return AppRoutes.forArtistReleasesCreateAddReleaseInformation;
            case 1:
                return AppRoutes.forArtistReleasesCreateUploadTracks;
            case 2:
                return AppRoutes.forArtistReleasesCreatePublish;
            default:
                return '';
        }
    }

    private navigateTo(path: string): void {
        this.router.navigate([path], {
            relativeTo: this.activatedRoute,
        });
    }
}
