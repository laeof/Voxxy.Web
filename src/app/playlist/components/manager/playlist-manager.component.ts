import { Component, Input } from '@angular/core';
import { ManagerFacade } from '../../../common/facades/manager.facade';
import { Playlist } from '../../models/playlist';
import { TranslatePipe } from '@ngx-translate/core';
import { PlaylistTypeTranslatePipe } from '../../../common/pipes/playlist-type-translation.pipe';
import { MatIcon } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';
import { PlaylistService } from '../../services/playlist.service';
import { PlaylistType } from '../../enums/playlist-type';


@Component({
    selector: 'playlist-manager',
    standalone: true,
    templateUrl: './playlist-manager.component.html',
    styleUrl: './playlist-manager.component.scss',
    imports: [TranslatePipe, PlaylistTypeTranslatePipe, MatIcon, AsyncPipe],
})
export class PlaylistManagerComponent extends ManagerFacade {
    @Input() playlist: Playlist | undefined | null;

    protected readonly PlaylistType = PlaylistType;

    constructor(private readonly playlistService: PlaylistService) {
        super();
    }
}
