import { Injectable } from '@angular/core';
import { MediaPlayerStateService } from '@common/services/media-player-state.service';
import { ConnectCommandService } from './connect-command.service';

const COALESCE_DELAY_MS = 150;

@Injectable({ providedIn: 'root' })
export class ConnectCommandCoalescer {
    private volumeTimer: ReturnType<typeof setTimeout> | null = null;
    private pendingVolume: number | null = null;

    constructor(
        private readonly commands: ConnectCommandService,
        private readonly playerState: MediaPlayerStateService,
    ) {}

    setVolume(volumePercent: number): void {
        this.playerState.setVolume(volumePercent);
        this.pendingVolume = volumePercent;
        if (this.volumeTimer !== null) clearTimeout(this.volumeTimer);
        this.volumeTimer = setTimeout(() => {
            const value = this.pendingVolume;
            this.volumeTimer = null;
            this.pendingVolume = null;
            if (value !== null) void this.commands.changeVolume(value);
        }, COALESCE_DELAY_MS);
    }

    previewSeek(positionSec: number): void {
        this.playerState.setPosition(positionSec);
    }

    commitSeek(positionSec: number): void {
        void this.commands.changePosition(Math.floor(positionSec * 1000));
    }
}
