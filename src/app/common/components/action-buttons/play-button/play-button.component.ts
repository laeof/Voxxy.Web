import { AsyncPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MediaPlayerStateService } from '@common/services/media-player-state.service';
import { MediaPlayerSyncService } from '@common/services/media-player-sync.service';
import { Track } from '@features/track/models/track';

@Component({
    selector: 'action-play-button',
    templateUrl: './play-button.component.html',
    styleUrl: './play-button.component.scss',
    imports: [MatIcon, AsyncPipe],
})
export class PlayButtonComponent {
    constructor(
        public readonly mediaPlayerStateService: MediaPlayerStateService,
        private readonly mediaPlayerSyncService: MediaPlayerSyncService,
    ) {}

    @Input() trackList: Track[] | undefined = [];
    @Input() trackListId: string | undefined = undefined;

    togglePlayButton(): void {
        if (!this.trackList || this.trackList.length === 0) return;

        if (this.mediaPlayerStateService.currentTrack?.id === this.trackList[0].id) {
            this.mediaPlayerStateService.playing
                ? this.mediaPlayerSyncService.pause()
                : this.mediaPlayerSyncService.play();
            return;
        }

        this.mediaPlayerSyncService.play(this.trackList[0].id, 0);
    }
}
