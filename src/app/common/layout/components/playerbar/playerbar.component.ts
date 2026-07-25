import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { Observable } from 'rxjs';
import { RepeatMode } from '@common/enums/repeat-mode.enum';
import { DurationTranslatePipe } from '@common/pipes/duration-translation.pipe';
import { MediaPlayerStateService } from '@common/services/media-player-state.service';
import { Track } from '@features/track/models/track';
import { DeviceComponent } from './components/device/device.component';
import { locale as english } from './i18n/en';
import { locale as russian } from './i18n/ru';
import { TranslationLoaderService } from '@common/services/translation-loader.service';
import { MediaPlayerSyncService } from '@common/services/media-player-sync.service';

@Component({
    selector: 'layout-playerbar',
    standalone: true,
    templateUrl: './playerbar.component.html',
    styleUrl: './playerbar.component.scss',
    imports: [
        MatIcon,
        MatSlider,
        MatSliderThumb,
        DurationTranslatePipe,
        AsyncPipe,
        DeviceComponent,
    ],
})
export class PlayerBarComponent {
    constructor(
        private readonly mediaPlayerStateService: MediaPlayerStateService,
        private readonly translationLoaderService: TranslationLoaderService,
        private readonly mediaPlayerSyncService: MediaPlayerSyncService,
    ) {
        this.currentTime$ = this.mediaPlayerSyncService.viewPosition$;
        this.currentVolume$ = this.mediaPlayerStateService.volumeObs$;
        this.currentTrack$ = this.mediaPlayerStateService.currentTrackObs$;
        this.isPlaying$ = this.mediaPlayerStateService.playingObs$;
        this.repeatState$ = this.mediaPlayerStateService.repeatObs$;

        this.translationLoaderService.loadTranslations(english, russian);
    }

    protected readonly RepeatMode = RepeatMode;

    currentTime$: Observable<number>;
    currentVolume$: Observable<number>;
    currentTrack$: Observable<Track | null | undefined>;
    isPlaying$: Observable<boolean>;
    repeatState$: Observable<RepeatMode>;

    volumeChange($event: Event) {
        const value = ($event.target as HTMLInputElement).valueAsNumber;
        this.mediaPlayerSyncService.setVolume(value);
    }

    trackPositionChange(position: number) {
        this.mediaPlayerSyncService.seek(position);
    }

    togglePlayPause() {
        if (this.mediaPlayerStateService.playing) {
            this.mediaPlayerSyncService.pause();
        } else {
            this.mediaPlayerSyncService.play();
        }
    }

    toggleRepeat() {
        const next = {
            none: RepeatMode.All,
            all: RepeatMode.One,
            one: RepeatMode.None,
        }[this.mediaPlayerStateService.repeat];

        this.mediaPlayerStateService.setRepeat(next);
    }

    togglePrev() {
        this.mediaPlayerStateService.prev();
    }

    toggleNext() {
        this.mediaPlayerStateService.next();
    }

    toggleShuffle() {
        // this.mediaPlayerStateService.shuffle();
    }
}
