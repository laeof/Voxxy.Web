import { Component, OnDestroy } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe, CommonModule } from '@angular/common';
import {
    AudioFileItem,
    FileDragDropComponent,
} from '@common/components/file-drag-drop/file-drag-drop.component';
import { FileFormats } from '@common/constants/file-format.constant';
import { TranslatePipe } from '@ngx-translate/core';
import { ReleaseCreateFormService } from '../../release-create-form.service';
import { TracksListComponent } from './components/tracks-list/tracks-list.component';
import { Subject, takeUntil } from 'rxjs';
import { UploadTracksListFacade } from './components/tracks-list/facades/track-list.facade';
import { LocalTrackEntity } from './components/tracks-list.service';

@Component({
    selector: 'for-artist-release-create-upload-tracks',
    standalone: true,
    templateUrl: './upload-tracks.component.html',
    styleUrl: './upload-tracks.component.scss',
    imports: [
        CommonModule,
        FileDragDropComponent,
        TranslatePipe,
        ReactiveFormsModule,
        TracksListComponent,
        AsyncPipe,
    ],
})
export class UploadTracksComponent implements OnDestroy {
    musicFormats: string = FileFormats.musicFileTypes;
    private readonly destroy$ = new Subject<void>();

    constructor(
        public readonly releaseCreateFormService: ReleaseCreateFormService,
        public readonly uploadTracksListFacade: UploadTracksListFacade,
    ) {
        this.uploadTracksListFacade.trackRemoved
            .pipe(takeUntil(this.destroy$))
            .subscribe((track: LocalTrackEntity) => {
                this.onTrackRemoved(track.id);
            });

        this.uploadTracksListFacade.trackTitleUpdated
            .pipe(takeUntil(this.destroy$))
            .subscribe(({ trackId, title }: { trackId: string; title: string }) => {
                this.onTrackTitleUpdated(trackId, title);
            });

        this.uploadTracksListFacade.trackIsRemixUpdated
            .pipe(takeUntil(this.destroy$))
            .subscribe(({ trackId, isRemix }: { trackId: string; isRemix: boolean }) => {
                this.onTrackIsRemixUpdated(trackId, isRemix);
            });

        this.uploadTracksListFacade.tracksReordered
            .pipe(takeUntil(this.destroy$))
            .subscribe((tracks: LocalTrackEntity[]) => {
                this.onTracksUpdated(tracks);
            });

        this.uploadTracksListFacade.tracksUpdated
            .pipe(takeUntil(this.destroy$))
            .subscribe((tracks: LocalTrackEntity[]) => {
                this.onTracksUpdated(tracks);
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get tracksArray(): FormArray<FormGroup> {
        return this.releaseCreateFormService.uploadFilesForm.get('tracks') as FormArray<FormGroup>;
    }
    get audioFilesInput(): FormArray {
        return this.releaseCreateFormService.uploadFilesForm.get('audioFilesInput') as FormArray;
    }

    onFilesAdded(files: AudioFileItem[]): void {
        this.uploadTracksListFacade.setAudioFiles(files);
    }

    onTrackRemoved(trackId: string): void {
        this.tracksArray.removeAt(
            this.tracksArray?.value.findIndex((track) => track.audioFile?.id === trackId),
        );

        this.audioFilesInput.setValue(
            this.audioFilesInput?.value.filter((file: AudioFileItem) => file.id !== trackId),
        );
    }

    onTrackTitleUpdated(trackId: string, title: string): void {
        this.tracksArray.value.find(
            (track: LocalTrackEntity) => track.audioFile?.id === trackId,
        ).title = title;
    }

    onTrackIsRemixUpdated(trackId: string, isRemix: boolean): void {
        this.tracksArray.value.find(
            (track: LocalTrackEntity) => track.audioFile?.id === trackId,
        ).isRemix = isRemix;
    }

    onTracksUpdated(tracks: LocalTrackEntity[]): void {
        this.tracksArray.clear();
        tracks.forEach((track) => {
            this.tracksArray.push(
                this.releaseCreateFormService.createTrackFormGroup(track.audioFile, track.position, track.isRemix),
            );
        });
    }
}
