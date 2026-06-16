import { Injectable } from '@angular/core';
import { FormGroup, FormControl, FormArray, Validators } from '@angular/forms';
import { AudioFileItem } from '@common/components/file-drag-drop/file-drag-drop.component';
import { ImageFileItem } from '@common/components/subject-image-upload/subject-image-upload.component';
import { SubjectSelectOption } from '@common/components/subject-select/subject-select.component';
import {
    ReleaseCreateMainInformation,
    ReleaseCreateTrack,
} from './interfaces/release-create.interface';
import { ArtistStateService } from '@common/services/artist-state.service';
import { LocalTrackEntity } from './components/upload-tracks/components/tracks-list.service';

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
        audioFilesInput: new FormControl<AudioFileItem[]>([], {
            nonNullable: true,
        }),
        tracks: new FormArray<
            FormGroup<{
                title: FormControl<string>;
                position: FormControl<number>;
                language: FormControl<SubjectSelectOption | null>;
                isRemix: FormControl<boolean>;
                audioFile: FormControl<AudioFileItem | null>;
            }>
        >([], {
            validators: [Validators.required],
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
        const tracksArray = this.uploadFilesForm.get('tracks') as FormArray;
        return tracksArray.value.map((trackGroup: LocalTrackEntity, index: number) => ({
            title: trackGroup.title || '',
            position: trackGroup.position || index + 1,
            duration: trackGroup.audioFile?.duration || 0,
            language: trackGroup.language || '',
            audioFile: trackGroup.audioFile || null,
            isRemix: trackGroup.isRemix || false,
        }));
    }

    createTrackFormGroup(audioFile: AudioFileItem, position: number, isRemix: boolean): FormGroup {
        return new FormGroup({
            title: new FormControl<string>(audioFile.name, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            position: new FormControl<number>(position, {
                nonNullable: true,
                validators: [Validators.required, Validators.min(1)],
            }),
            language: new FormControl<SubjectSelectOption | null>(null),
            isRemix: new FormControl<boolean>(isRemix, {
                nonNullable: true,
            }),
            audioFile: new FormControl<AudioFileItem | null>(audioFile, {
                nonNullable: true,
            }),
        });
    }
}
