import { Component, Input } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';
import { UploadTracksListFacade } from './facades/track-list.facade';
import { LocalMediaPlayerService, LocalTrack } from '@common/services/local-media-player.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'for-artist-tracks-list',
    standalone: true,
    templateUrl: './tracks-list.component.html',
    styleUrl: './tracks-list.component.scss',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatTableModule,
        MatIconModule,
        MatButtonModule,
        TranslatePipe,
        DragDropModule,
        AsyncPipe,
    ],
})
export class TracksListComponent {
    @Input({ required: true }) tracksFacade!: UploadTracksListFacade;

    readonly isPlaying$: Observable<boolean>;
    readonly currentTrack$: Observable<LocalTrack | null>;

    constructor(private readonly localMediaPlayerService: LocalMediaPlayerService) {
        this.isPlaying$ = this.localMediaPlayerService.playing$;
        this.currentTrack$ = this.localMediaPlayerService.currentTrack$;
    }

    displayedColumns: string[] = [
        'drag',
        'position',
        'play',
        'title',
        'isRemix',
        'duration',
        'delete',
    ];

    editingIndex: number | null = null;

    startEditingTitle(index: number): void {
        this.editingIndex = index;
    }

    saveTitle(trackId: string, event: Event): void {
        const input = event.target as HTMLInputElement;
        const title = input.value.trim();

        if (title) {
            this.tracksFacade.updateTitle(trackId, title);
        }

        this.editingIndex = null;
    }

    updateIsRemix(trackId: string, isRemix: boolean): void {
        this.tracksFacade.updateIsRemix(trackId, isRemix);
    }

    cancelEditingTitle(): void {
        this.editingIndex = null;
    }
}
