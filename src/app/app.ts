import { Component, signal } from '@angular/core';
import { MatIconsService } from './common/services/mat-icons.service';
import { TranslateService } from '@ngx-translate/core';
import { RouterOutlet } from '@angular/router';
import { MediaPlayerEngineService } from './common/services/media-player-engine.service';
import { PlayerTitleService } from './common/services/player-title.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.html',
    styleUrl: './app.scss',
    imports: [RouterOutlet],
    providers: [TranslateService],
})
export class App {
    protected readonly title = signal('Voxxy');

    /* matIconsService is necessary for mat-icon work */
    /* mediaPlayerEngineService is necessary for audio playback */
    /* playerTitleService is necessary for updating the document title */
    constructor(
        private readonly matIconsService: MatIconsService,
        private readonly mediaPlayerEngineService: MediaPlayerEngineService,
        private readonly playerTitleService: PlayerTitleService,
        private readonly translateService: TranslateService,
    ) {
        this.translateService.addLangs(['en', 'ru', 'ua']);
        this.translateService.use('en');
    }
}
