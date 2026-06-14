import { Component } from '@angular/core';
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
})
export class AddInformationComponent {
    constructor(public readonly releaseCreateFormService: ReleaseCreateFormService) {}

    artistsOptions: SubjectSelectOption[] = [
        { id: '1', title: 'pfrt 1' },
        { id: '2', title: 'Artist 2' },
        { id: '3', title: 'Artist 3' },
    ];

    searchedArtists: SubjectSelectOption[] = [];
    selectedArtists: SubjectSelectOption[] = [];

    releaseTypes: SubjectSelectOption[] = [
        { id: 'single', title: 'Single' },
        { id: 'ep', title: 'EP' },
        { id: 'album', title: 'Album' },
    ];

    selectedType: SubjectSelectOption | null = null;

    genresOptions: SubjectSelectOption[] = [
        { id: '1', title: 'Genre 1' },
        { id: '2', title: 'Genre 2' },
        { id: '3', title: 'Genre 3' },
    ];

    searchedGenres: SubjectSelectOption[] = [];
    selectedGenres: SubjectSelectOption[] = [];

    moodsOptions: SubjectSelectOption[] = [
        { id: '1', title: 'Mood 1' },
        { id: '2', title: 'Mood 2' },
        { id: '3', title: 'Mood 3' },
    ];

    searchedMoods: SubjectSelectOption[] = [];
    selectedMoods: SubjectSelectOption[] = [];

    onArtistSearchChange(artistName: string): void {
        // Implement search logic here, e.g., filter the artists based on the search input
        console.log('Searching for artists with name:', artistName);
        this.searchedArtists = this.artistsOptions.filter((artist) =>
            artist.title.toLowerCase().includes(artistName.toLowerCase()),
        );
        console.log('Searched artists:', this.searchedArtists);
    }

    onGenreSearchChange(genreName: string): void {
        // Implement search logic here, e.g., filter the genres based on the search input
        console.log('Searching for genres with name:', genreName);
        this.searchedGenres = this.genresOptions.filter((genre) =>
            genre.title.toLowerCase().includes(genreName.toLowerCase()),
        );
        console.log('Searched genres:', this.searchedGenres);
    }

    onMoodSearchChange(moodName: string): void {
        // Implement search logic here, e.g., filter the moods based on the search input
        console.log('Searching for moods with name:', moodName);
        this.searchedMoods = this.moodsOptions.filter((mood) =>
            mood.title.toLowerCase().includes(moodName.toLowerCase()),
        );
        console.log('Searched moods:', this.searchedMoods);
    }
}
