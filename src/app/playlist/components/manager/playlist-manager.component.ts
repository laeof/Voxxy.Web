import { Component, Input } from '@angular/core';
import { Playlist } from '../../models/playlist';
import { TranslatePipe } from '@ngx-translate/core';
import { PlaylistTypeTranslatePipe } from '../../../common/pipes/playlist-type-translation.pipe';
import { MatIcon } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';
import { PlaylistType } from '../../../common/enums/playlist-type';
import { MediaPlayerStateService } from '../../../common/services/media-player-state.service';

@Component({
    selector: 'playlist-manager',
    standalone: true,
    templateUrl: './playlist-manager.component.html',
    styleUrl: './playlist-manager.component.scss',
    imports: [TranslatePipe, PlaylistTypeTranslatePipe, MatIcon, AsyncPipe],
})
export class PlaylistManagerComponent {
    @Input() playlist: Playlist | undefined | null;

    protected readonly PlaylistType = PlaylistType;

    constructor(public readonly mediaPlayerStateService: MediaPlayerStateService) {}

    togglePlayButton() {
        if (!this.playlist?.tracks || this.playlist?.tracks.length === 0) return;

        if (this.mediaPlayerStateService.current?.fromPlaylist === this.playlist?.id) {
            this.mediaPlayerStateService.playing
                ? this.mediaPlayerStateService.pause()
                : this.mediaPlayerStateService.play();
            return;
        }

        this.mediaPlayerStateService.playQueue(this.playlist?.tracks || [], 0);
    }
}
