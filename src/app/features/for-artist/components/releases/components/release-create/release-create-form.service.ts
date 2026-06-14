import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AudioFileItem } from '@common/components/file-drag-drop/file-drag-drop.component';
import { ImageFileItem } from '@common/components/subject-image-upload/subject-image-upload.component';
import { SubjectSelectOption } from '@common/components/subject-select/subject-select.component';
import {
    ReleaseCreateMainInformation,
    ReleaseCreateTrack,
} from './interfaces/release-create.interface';
import { ArtistStateService } from '@common/services/artist-state.service';

@Injectable()
export class ReleaseCreateFormService {
    constructor(private readonly artistStateService: ArtistStateService) {}

    mainInformationForm = new FormGroup({
        releaseCover: new FormControl<ImageFileItem | null>(null, {
            nonNullable: true,
            validators: [Validators.required],
        }),
        releaseTitle: new FormControl<string>('', {
            nonNullable: true,
            validators: [Validators.required],
        }),
        releaseArtists: new FormControl<SubjectSelectOption[]>([], {}),
        releaseType: new FormControl<SubjectSelectOption | null>(null, {
            validators: [Validators.required],
        }),
        releaseGenres: new FormControl<SubjectSelectOption[]>([], {
            nonNullable: true,
            validators: [Validators.required],
        }),
        releaseMoods: new FormControl<SubjectSelectOption[]>([], {}),
        releaseDate: new FormControl<string>(new Date().toISOString().split('T')[0], {
            nonNullable: true,
            validators: [Validators.required],
        }),
        releaseCopyright: new FormControl<string>('', {}),
        releaseAdditionalInformation: new FormControl<string>('', {}),
    });

    uploadFilesForm = new FormGroup({
        audioFiles: new FormControl<AudioFileItem[]>([], {
            nonNullable: true,
            validators: [Validators.required],
        }),
        title: new FormControl<string>('', {
            nonNullable: true,
            validators: [Validators.required],
        }),
        position: new FormControl<number>(0, {
            nonNullable: true,
            validators: [Validators.required, Validators.min(0)],
        }),
        language: new FormControl<SubjectSelectOption | null>(null),
        isRemix: new FormControl<boolean>(false, {
            nonNullable: true,
        }),
    });

    get allFormsValid(): boolean {
        return this.mainInformationForm.valid && this.uploadFilesForm.valid;
    }

    get buildMainInformationForm(): ReleaseCreateMainInformation {
        return {
            title: this.mainInformationForm.value.releaseTitle || '',
            coverImage: this.mainInformationForm.value.releaseCover!,
            releaseDate: this.mainInformationForm.value.releaseDate || '',
            additionalInformation:
                this.mainInformationForm.value.releaseAdditionalInformation || '',
            artistIds: [
                this.artistStateService.value()[0].id,
                ...(this.mainInformationForm.value.releaseArtists?.map((artist) => artist.id) ||
                    []),
            ],
        };
    }

    get buildUploadTracksForm(): ReleaseCreateTrack[] {
        return (
            this.uploadFilesForm.value.audioFiles?.map((audioFile: AudioFileItem) => ({
                title: this.uploadFilesForm.value.title || '',
                position: this.uploadFilesForm.value.position || 0,
                duration: audioFile.duration,
                language: this.uploadFilesForm.value.language?.id || '',
                audioFile: audioFile,
                isRemix: this.uploadFilesForm.value.isRemix || false,
            })) || []
        );
    }
}
