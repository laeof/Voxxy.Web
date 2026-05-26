import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MediaPlayerStateService } from '@common/services/media-player-state.service';

@Component({
    selector: 'layout-logo',
    standalone: true,
    templateUrl: './logo.component.html',
    styleUrl: './logo.component.scss',
    imports: [MatIcon, AsyncPipe],
})
export class LogoComponent {
    constructor(public readonly mediaPlayerStateService: MediaPlayerStateService) {}
}
