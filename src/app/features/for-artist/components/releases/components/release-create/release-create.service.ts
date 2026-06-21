import { Injectable, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppRoutes } from '@common/constants/app.routes.constant';
import { NavigationService } from '@common/services/navigation.service';
import { map, merge, Observable, startWith, Subject, takeUntil } from 'rxjs';
import { ReleaseCreateFormService } from './release-create-form.service';
import {
    ReleaseCreateForm,
    ReleaseCreateMainInformation,
    ReleaseCreateTrack,
} from './interfaces/release-create.interface';
import { ReleaseCreateStateService } from '@features/for-artist/services/release-create-state.service';
import { HttpClient } from '@angular/common/http';
import { ApiRoutes } from '@common/constants/api.routes.constant';
import { environment } from '@environments/environment';

@Injectable()
export class ReleaseCreateService implements OnDestroy {
    private readonly destroy$ = new Subject<void>();
    public createState$: Observable<number>;

    private readonly routeChanged$ = new Subject<void>();
    readonly formValid$: Observable<boolean>;

    constructor(
        private readonly navigationService: NavigationService,
        private readonly releaseCreateFormService: ReleaseCreateFormService,
        private readonly releaseCreateStateService: ReleaseCreateStateService,
        private readonly httpClient: HttpClient,
    ) {
        this.createState$ = this.releaseCreateStateService.createState$;

        this.navigationService.navigationEndSubscribe(this.destroy$, () => {
            this.routeChanged$.next();
        });

        this.formValid$ = merge(
            this.routeChanged$,
            this.releaseCreateFormService.mainInformationForm.statusChanges,
            this.releaseCreateFormService.uploadFilesForm.statusChanges,
        ).pipe(
            takeUntil(this.destroy$),
            startWith(null),
            map(() => this.calculateFormValid()),
        );
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.releaseCreateStateService.resetState();
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

    increaseStage(activatedRoute?: ActivatedRoute): void {
        this.releaseCreateStateService.increaseStage();
        this.navigateTo(this.stepByProgress, activatedRoute);
    }

    decreaseStage(activatedRoute?: ActivatedRoute): void {
        this.releaseCreateStateService.decreaseStage();
        this.navigateTo(this.stepByProgress, activatedRoute);
    }

    get stepByProgress(): string {
        return this.releaseCreateStateService.stepByProgress;
    }

    private navigateTo(path: string, relativeTo?: ActivatedRoute): void {
        this.navigationService.navigateNextPath(path, relativeTo);
    }

    submitRelease(): void {
        let tracks: ReleaseCreateTrack[] = this.releaseCreateFormService.buildUploadTracksForm;

        let mainInformation: ReleaseCreateMainInformation =
            this.releaseCreateFormService.buildMainInformationForm;

        let model: ReleaseCreateForm = {
            tracks: tracks,
            title: mainInformation.title,
            coverImage: mainInformation.coverImage.file,
            releaseDate: mainInformation.releaseDate,
            additionalInformation: mainInformation.additionalInformation,
            artistIds: mainInformation.artistIds,
            moodIds: mainInformation.moodIds,
            genreIds: mainInformation.genreIds,
            copyright: mainInformation.copyright,
            releaseType: mainInformation.releaseType,
        };

        let formData = new FormData();

        formData.append('title', model.title);
        formData.append('releaseDate', model.releaseDate);
        formData.append('additionalInformation', model.additionalInformation);
        formData.append('coverImage', model.coverImage);
        formData.append('copyright', model.copyright);
        formData.append('releaseType', model.releaseType);

        model.artistIds.forEach((id) => {
            formData.append('artistIds', id);
        });

        model.moodIds.forEach((id) => {
            formData.append('moodIds', id);
        });

        model.genreIds.forEach((id) => {
            formData.append('genreIds', id);
        });

        model.tracks.forEach((track, index) => {
            formData.append(`tracks[${index}].title`, track.title);
            formData.append(`tracks[${index}].position`, track.position.toString());
            formData.append(`tracks[${index}].duration`, track.duration.toString());
            formData.append(`tracks[${index}].isRemix`, track.isRemix.toString());
            formData.append(`tracks[${index}].audioFile`, track.audioFile?.file!);
        });

        const url = `${environment.apiUrl}${ApiRoutes.ForArtists.releases}`;

        this.httpClient.post(url, formData).subscribe((response) => {
            this.navigationService.navigateForArtist(AppRoutes.forArtistReleases);
        });
    }
}
