import { AsyncPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MediaPlayerStateService } from '@common/services/media-player-state.service';
import { Track } from '@features/track/models/track';

@Component({
    selector: 'action-play-button',
    templateUrl: './play-button.component.html',
    styleUrl: './play-button.component.scss',
    imports: [MatIcon, AsyncPipe],
})
export class PlayButtonComponent {
    constructor(public readonly mediaPlayerStateService: MediaPlayerStateService) {}

    @Input() trackList: Track[] | undefined = [];
    @Input() trackListId: string | undefined = undefined;

    togglePlayButton(): void {
        if (!this.trackList || !this.trackListId || this.trackList.length === 0) return;

        if (this.mediaPlayerStateService.currentTrack?.fromPlaylist === this.trackListId) {
            this.mediaPlayerStateService.playing
                ? this.mediaPlayerStateService.pause()
                : this.mediaPlayerStateService.play();
            return;
        }

        this.mediaPlayerStateService.playQueue(this.trackList || [], 0);
    }
}
