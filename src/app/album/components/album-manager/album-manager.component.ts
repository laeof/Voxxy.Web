import { Component, Input } from '@angular/core';
import { Album } from '../../models/album';
import { PlaylistTypeTranslatePipe } from '../../../common/pipes/playlist-type-translation.pipe';
import { TranslatePipe } from '@ngx-translate/core';
import { MediaPlayerStateService } from '../../../common/services/media-player-state.service';
import { PlaylistType } from '../../../common/enums/playlist-type';
import { AsyncPipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'album-manager',
    standalone: true,
    templateUrl: './album-manager.component.html',
    styleUrl: './album-manager.component.scss',
    imports: [PlaylistTypeTranslatePipe, TranslatePipe, AsyncPipe, MatIcon],
})
export class AlbumManagerComponent {
    @Input() album: Album | null | undefined = null;

    protected readonly PlaylistType = PlaylistType;

    constructor(public readonly mediaPlayerStateService: MediaPlayerStateService) {}

    togglePlayButton() {
        if (!this.album?.tracks || this.album?.tracks.length === 0) return;

        if (this.mediaPlayerStateService.current?.fromPlaylist === this.album?.id) {
            this.mediaPlayerStateService.playing
                ? this.mediaPlayerStateService.pause()
                : this.mediaPlayerStateService.play();
            return;
        }

        this.mediaPlayerStateService.playQueue(this.album?.tracks || [], 0);
    }
}
