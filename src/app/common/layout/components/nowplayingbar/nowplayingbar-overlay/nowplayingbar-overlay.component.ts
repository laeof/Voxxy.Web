import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ToggleBarService } from '@common/layout/services/togglebar.service';

@Component({
    selector: 'nowplayingbar-overlay',
    templateUrl: './nowplayingbar-overlay.component.html',
    styleUrl: './nowplayingbar-overlay.component.scss',
    standalone: true,
    imports: [MatIcon, MatInputModule],
})
export class NowPlayingBarOverlayComponent {
    constructor(private readonly toggleBarService: ToggleBarService) {}

    toggleNowPlayingBar(): void {
        this.toggleBarService.toggleNowPlayingBar();
    }
}
