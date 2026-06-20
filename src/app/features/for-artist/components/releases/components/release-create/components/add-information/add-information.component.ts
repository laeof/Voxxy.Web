import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SubjectInputComponent } from '@common/components/subject-input/subject-input.component';
import { SeparatorComponent } from '@common/components/separator/separator.component';
import { SubjectTextareaComponent } from '@common/components/subject-textarea/subject-textarea.component';
import { SubjectImageUploadComponent } from '@common/components/subject-image-upload/subject-image-upload.component';
import { ReleaseCreateFormService } from '../../release-create-form.service';
import { MatInputModule } from '@angular/material/input';
import {
    SubjectSelectComponent,
    SubjectSelectOption,
} from '@common/components/subject-select/subject-select.component';
import { SubjectDateComponent } from '@common/components/subject-date/subject-date.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AddInformationSearchService } from './search.service';
import { distinctUntilChanged, map, of, Subject, switchMap, takeUntil } from 'rxjs';
import { ReleaseType } from './enums/release-types.enum';

@Component({
    selector: 'for-artist-release-create-add-information',
    standalone: true,
    templateUrl: './add-information.component.html',
    styleUrl: './add-information.component.scss',
    imports: [
        TranslatePipe,
        SubjectInputComponent,
        SeparatorComponent,
        SubjectTextareaComponent,
        SubjectImageUploadComponent,
        MatInputModule,
        SubjectSelectComponent,
        SubjectDateComponent,
        ReactiveFormsModule,
    ],
    providers: [AddInformationSearchService],
})
export class AddInformationComponent implements OnInit, OnDestroy {
    constructor(
        public readonly releaseCreateFormService: ReleaseCreateFormService,
        private readonly searchService: AddInformationSearchService,
    ) {}

    private readonly destroy$ = new Subject<void>();

    private readonly genreSearch$ = new Subject<string>();
    private readonly moodSearch$ = new Subject<string>();
    private readonly artistSearch$ = new Subject<string>();

    searchedArtists: SubjectSelectOption[] = [];
    selectedArtists: SubjectSelectOption[] = [];

    releaseTypes: SubjectSelectOption[] = [
        { id: ReleaseType.Single.toString(), title: 'Single' },
        { id: ReleaseType.EF.toString(), title: 'EP' },
        { id: ReleaseType.Album.toString(), title: 'Album' },
    ];

    selectedType: SubjectSelectOption | null = null;

    searchedGenres: SubjectSelectOption[] = [];
    selectedGenres: SubjectSelectOption[] = [];

    searchedMoods: SubjectSelectOption[] = [];
    selectedMoods: SubjectSelectOption[] = [];

    ngOnInit(): void {
        this.genreSearch$
            .pipe(
                map((value) => value.trim()),
                distinctUntilChanged(),
                switchMap((query) => {
                    if (query.length < 2) {
                        return of([]);
                    }

                    return this.searchService.searchGenre(query);
                }),
                takeUntil(this.destroy$),
            )
            .subscribe((results) => {
                this.searchedGenres = results ?? [];
            });

        this.moodSearch$
            .pipe(
                map((value) => value.trim()),
                distinctUntilChanged(),
                switchMap((query) => {
                    if (query.length < 2) {
                        return of([]);
                    }

                    return this.searchService.searchMood(query);
                }),
                takeUntil(this.destroy$),
            )
            .subscribe((results) => {
                this.searchedMoods = results ?? [];
            });

        this.artistSearch$
            .pipe(
                map((value) => value.trim()),
                distinctUntilChanged(),
                switchMap((query) => {
                    if (query.length < 2) {
                        return of([]);
                    }

                    return this.searchService.searchArtist(query);
                }),
                takeUntil(this.destroy$),
            )
            .subscribe((results) => {
                this.searchedArtists = results ?? [];
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onArtistSearchChange(artistName: string): void {
        this.artistSearch$.next(artistName);
    }

    onGenreSearchChange(genreName: string): void {
        this.genreSearch$.next(genreName);
    }

    onMoodSearchChange(moodName: string): void {
        this.moodSearch$.next(moodName);
    }
}
