import { Component, ElementRef, HostListener, Input, OnDestroy } from '@angular/core';
import { ListEntitiesFacade } from '@common/facades/list-entities.facade';
import { TrackListService } from './services/track-list.service';
import { MatTableModule } from '@angular/material/table';
import {
    BehaviorSubject,
    combineLatest,
    distinctUntilChanged,
    map,
    shareReplay,
    Subject,
} from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIcon } from '@angular/material/icon';
import { AsyncPipe, NgClass } from '@angular/common';
import { DurationTranslatePipe } from '@common/pipes/duration-translation.pipe';
import { NavigationService } from '@common/services/navigation.service';
import { Track } from '@features/track/models/track';
import { MediaPlayerSyncService } from '@common/services/media-player-sync.service';
import { PlaybackSourceTypeContract } from '@common/connect/transport/connect-transport.models';
import { ConnectStateStore } from '@common/connect/state/connect-state.store';
import {
    currentQueueItem,
    displayedIndexForQueueItem,
    isSamePlaybackContext,
    queueItemForDisplayedTrack,
} from '@common/connect/state/playback-context';

interface TrackListPlaybackState {
    isCurrentContext: boolean;
    currentTrackId: string | null;
    currentQueueItemId: string | null;
    currentIndex: number;
    isPlaying: boolean;
}

@Component({
    selector: 'app-track-list',
    standalone: true,
    templateUrl: './track-list.component.html',
    styleUrl: './track-list.component.scss',
    imports: [MatTableModule, TranslatePipe, MatIcon, AsyncPipe, DurationTranslatePipe, NgClass],
    providers: [TrackListService],
})
export class TrackListComponent extends ListEntitiesFacade<Track> implements OnDestroy {
    private readonly _unsubscribeAll = new Subject<void>();
    private readonly sourceIdSubject = new BehaviorSubject<string | null>(null);
    private readonly sourceTypeSubject =
        new BehaviorSubject<PlaybackSourceTypeContract>('Manual');
    private readonly tracksSubject = new BehaviorSubject<readonly Track[]>([]);
    private tracksValue: Track[] | undefined | null = [];
    private sourceIdValue: string | undefined;
    private sourceTypeValue: PlaybackSourceTypeContract = 'Manual';

    @Input()
    set tracks(value: Track[] | undefined | null) {
        this.tracksValue = value;
        this.tracksSubject.next(value ?? []);
    }
    get tracks(): Track[] | undefined | null {
        return this.tracksValue;
    }
    @Input() allowHeader: boolean = true;
    @Input() showArtist: boolean = true;
    @Input()
    set sourceId(value: string | undefined) {
        this.sourceIdValue = value;
        this.sourceIdSubject.next(value ?? null);
    }
    get sourceId(): string | undefined {
        return this.sourceIdValue;
    }

    @Input()
    set sourceType(value: PlaybackSourceTypeContract) {
        this.sourceTypeValue = value;
        this.sourceTypeSubject.next(value);
    }
    get sourceType(): PlaybackSourceTypeContract {
        return this.sourceTypeValue;
    }

    readonly playbackState$;
    @Input() displayedColumns: string[] = ['Number', 'Name', 'Album', 'Duration'];

    constructor(
        private readonly trackListService: TrackListService,
        private readonly mediaPlayerSyncService: MediaPlayerSyncService,
        private readonly elRef: ElementRef,
        private readonly navigationService: NavigationService,
        private readonly connectStore: ConnectStateStore,
    ) {
        super(trackListService);
        this.playbackState$ = combineLatest([
            this.connectStore.queue$,
            this.connectStore.player$,
            this.sourceIdSubject,
            this.sourceTypeSubject,
            this.tracksSubject,
        ]).pipe(
            map(([queue, player, sourceId, sourceType, tracks]): TrackListPlaybackState => {
                const isCurrentContext =
                    sourceId !== null &&
                    isSamePlaybackContext(queue, { sourceId, sourceType });
                const selectedQueueItem = isCurrentContext
                    ? currentQueueItem(queue)
                    : null;
                const currentIndex =
                    queue && selectedQueueItem
                        ? displayedIndexForQueueItem(queue, tracks, selectedQueueItem)
                        : -1;
                return {
                    isCurrentContext,
                    currentTrackId: selectedQueueItem?.trackId ?? null,
                    currentQueueItemId: isCurrentContext
                        ? (queue?.currentQueueItemId ?? null)
                        : null,
                    currentIndex,
                    isPlaying: isCurrentContext && player?.isPlaying === true,
                };
            }),
            distinctUntilChanged(
                (previous, current) =>
                    previous.isCurrentContext === current.isCurrentContext &&
                    previous.currentTrackId === current.currentTrackId &&
                    previous.currentQueueItemId === current.currentQueueItemId &&
                    previous.currentIndex === current.currentIndex &&
                    previous.isPlaying === current.isPlaying,
            ),
            shareReplay({ bufferSize: 1, refCount: true }),
        );
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        if (!this.elRef.nativeElement.contains(event.target)) {
            this.onSelect(undefined);
        }
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();

        this.subscriptions.forEach((elem) => {
            if (elem) {
                elem.unsubscribe();
            }
        });
    }

    onSelect(track: Track | null | undefined): void {
        this.trackListService.onEntitySelectedId = track?.id;
    }

    togglePlayButton(track: Track) {
        if (!this.tracks || this.tracks.length === 0) return;

        if (!this.sourceId) return;
        const startIndex = this.tracks.indexOf(track);
        const { queue, player } = this.connectStore.value;
        const isCurrentContext =
            queue !== null &&
            isSamePlaybackContext(queue, {
                sourceId: this.sourceId,
                sourceType: this.sourceType,
            });
        const clickedQueueItem =
            isCurrentContext && queue
                ? queueItemForDisplayedTrack(queue, this.tracks, startIndex)
                : null;
        const isCurrentItem =
            clickedQueueItem !== null &&
            clickedQueueItem.queueItemId === queue?.currentQueueItemId;

        if (isCurrentItem) {
            if (player?.isPlaying) {
                this.mediaPlayerSyncService.pause();
            } else {
                this.mediaPlayerSyncService.play();
            }
            return;
        }

        void this.mediaPlayerSyncService
            .playContextFromDisplayedTrack(
                this.sourceId,
                this.sourceType,
                this.tracks,
                startIndex,
            )
            .catch((error: unknown) => {
                console.error('[Connect v2] track selection command failed', {
                    sourceId: this.sourceId,
                    sourceType: this.sourceType,
                    startIndex,
                    error,
                });
            });
    }

    navigateAlbum(albumId: string) {
        this.navigationService.navigateAlbumById(albumId);
    }

    navigateArtist(artistId: string) {
        this.navigationService.navigateArtistById(artistId);
    }
}
