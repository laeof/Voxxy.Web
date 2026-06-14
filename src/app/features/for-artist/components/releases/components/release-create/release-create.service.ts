import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppRoutes } from '@common/constants/app.routes.constant';
import { NavigationService } from '@common/services/navigation.service';
import { BehaviorSubject, map, merge, Observable, startWith, Subject } from 'rxjs';
import { ReleaseCreateFormService } from './release-create-form.service';
import {
    ReleaseCreateForm,
    ReleaseCreateMainInformation,
    ReleaseCreateTrack,
} from './interfaces/release-create.interface';

@Injectable()
export class ReleaseCreateService {
    private readonly createState: BehaviorSubject<number> = new BehaviorSubject(0);
    public createState$: Observable<number> = this.createState.asObservable();

    public stateDictionary: Record<number, string> = {
        0: AppRoutes.forArtistReleasesCreateAddReleaseInformation,
        1: AppRoutes.forArtistReleasesCreateUploadTracks,
        2: AppRoutes.forArtistReleasesCreatePublish,
    };

    private readonly routeChanged$ = new Subject<void>();
    readonly formValid$: Observable<boolean>;

    constructor(
        private readonly navigationService: NavigationService,
        private readonly activatedRoute: ActivatedRoute,
        private readonly releaseCreateFormService: ReleaseCreateFormService,
    ) {
        this.initState();
        this.navigationService.navigationEndSubscribe(() => {
            this.routeChanged$.next();
        });

        this.formValid$ = merge(
            this.routeChanged$,
            this.releaseCreateFormService.mainInformationForm.statusChanges,
            this.releaseCreateFormService.uploadFilesForm.statusChanges,
        ).pipe(
            startWith(null),
            map(() => this.calculateFormValid()),
        );
    }

    private calculateFormValid(): boolean {
        const route = this.navigationService.currentUrl.split('/').pop();

        switch (route) {
            case AppRoutes.forArtistReleasesCreateAddReleaseInformation:
                return this.releaseCreateFormService.mainInformationForm.valid;

            case AppRoutes.forArtistReleasesCreateUploadTracks:
                return this.releaseCreateFormService.uploadFilesForm.valid;

            case AppRoutes.forArtistReleasesCreatePublish:
                return (
                    this.releaseCreateFormService.mainInformationForm.valid &&
                    this.releaseCreateFormService.uploadFilesForm.valid
                );

            default:
                return false;
        }
    }

    initState(): void {
        const currentPath = this.navigationService.currentUrl.split('/').pop() ?? '';
        const stateEntry = Object.entries(this.stateDictionary).find(
            ([, path]) => path === currentPath,
        );

        if (stateEntry) {
            const [state] = stateEntry;
            this.createState.next(Number(state));
        }
    }

    increaseStage(): void {
        this.createState.next(this.createState.value + 1);
        this.navigateTo(this.stepByProgress);
    }

    decreaseStage(): void {
        this.createState.next(this.createState.value - 1);
        this.navigateTo(this.stepByProgress);
    }

    get stepByProgress(): string {
        return (
            this.stateDictionary[this.createState.value] ??
            AppRoutes.forArtistReleasesCreateAddReleaseInformation
        );
    }

    private navigateTo(path: string): void {
        this.navigationService.navigateNextPath(path, this.activatedRoute);
    }

    submitRelease(): void {
        let tracks: ReleaseCreateTrack[] = this.releaseCreateFormService.buildUploadTracksForm;

        let mainInformation: ReleaseCreateMainInformation =
            this.releaseCreateFormService.buildMainInformationForm;

        let model: ReleaseCreateForm = {
            tracks: tracks,
            title: mainInformation.title,
            coverImage: mainInformation.coverImage,
            releaseDate: mainInformation.releaseDate,
            additionalInformation: mainInformation.additionalInformation,
            artistIds: mainInformation.artistIds,
        };

        console.log('submit release');
        console.log(model);
    }
}
