import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TrackService } from '../../../track/services/track.service';
import { AsyncPipe } from '@angular/common';
import { Track } from '../../../track/models/track';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { DurationTranslatePipe } from '../../../common/pipes/duration-translation.pipe';
import { MediaPlayerStateService } from '../../../common/services/media-player-state.service';
import { Observable } from 'rxjs';
import { RepeatMode } from '../../../common/enums/repeat-mode.enum';

@Component({
    selector: 'layout-playerbar',
    standalone: true,
    templateUrl: './playerbar.component.html',
    styleUrl: './playerbar.component.scss',
    imports: [MatIcon, MatSlider, MatSliderThumb, DurationTranslatePipe, AsyncPipe],
    providers: [TrackService],
})
export class PlayerBarComponent {
    constructor(private readonly mediaPlayerStateService: MediaPlayerStateService) {
        this.currentTime$ = this.mediaPlayerStateService.positionObs$;
        this.currentVolume$ = this.mediaPlayerStateService.volumeObs$;
        this.currentTrack$ = this.mediaPlayerStateService.currentTrack$;
        this.isPlaying$ = this.mediaPlayerStateService.playingObs$;
        this.repeatState$ = this.mediaPlayerStateService.repeatObs$;
    }

    protected readonly RepeatMode = RepeatMode;

    currentTime$: Observable<number>;
    currentVolume$: Observable<number>;
    currentTrack$: Observable<Track | null | undefined>;
    isPlaying$: Observable<boolean>;
    repeatState$: Observable<RepeatMode>;

    volumeChange($event: Event) {
        const value = ($event.target as HTMLInputElement).valueAsNumber;
        this.mediaPlayerStateService.setVolume(value);
    }

    trackPositionChange($event: Event) {
        const value = ($event.target as HTMLInputElement).valueAsNumber;
        this.mediaPlayerStateService.setPosition(value);
    }

    togglePlayPause() {
        if (this.mediaPlayerStateService.playing) {
            this.mediaPlayerStateService.pause();
        } else {
            this.mediaPlayerStateService.play();
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
