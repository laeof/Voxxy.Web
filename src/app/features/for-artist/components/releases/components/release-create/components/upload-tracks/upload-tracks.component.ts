import { Component } from '@angular/core';
import {
    AudioFileItem,
    FileDragDropComponent,
} from '@common/components/file-drag-drop/file-drag-drop.component';
import { FileFormats } from '@common/constants/file-format.constant';
import { TranslatePipe } from '@ngx-translate/core';
import { ReleaseCreateFormService } from '../../release-create-form.service';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'for-artist-release-create-upload-tracks',
    standalone: true,
    templateUrl: './upload-tracks.component.html',
    styleUrl: './upload-tracks.component.scss',
    imports: [FileDragDropComponent, TranslatePipe, ReactiveFormsModule],
})
export class UploadTracksComponent {
    musicFormats: string = FileFormats.musicFileTypes;

    constructor(public readonly releaseCreateFormService: ReleaseCreateFormService) {}

    onAudioFilesSelected(files: AudioFileItem[]): void {
        console.log(files);

        // files[0].file         сам File
        // files[0].name         название
        // files[0].duration     длительность в секундах
        // files[0].durationText строка типа 3:42
    }
}
