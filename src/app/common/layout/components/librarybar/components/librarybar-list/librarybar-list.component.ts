import { Component, OnDestroy } from '@angular/core';
import { MatNavList } from '@angular/material/list';
import { TranslatePipe } from '@ngx-translate/core';
import { LibraryDto } from './dtos/library-dto';
import { LibraryBarService } from '../services/librarybar.service';
import { AsyncPipe, NgClass } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import {
    combineLatest,
    map,
    shareReplay,
    startWith,
    Subject,
    Subscription,
    takeUntil,
} from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { FollowType } from '../../enums/follow-type-enum';
import { AppRoutes } from '@common/constants/app.routes.constant';
import { ListEntitiesFacade } from '@common/facades/list-entities.facade';
import { PlaylistTypeTranslatePipe } from '@common/pipes/playlist-type-translation.pipe';
import { NavigationService } from '@common/services/navigation.service';
import { FollowService } from '@common/services/follow-service';
import { ManagerSubjectNameComponent } from '@common/components/manager/manager-subject-info/subject-name/subject-name.component';
import { MediaPlayerSyncService } from '@common/services/media-player-sync.service';
import { ConnectStateStore } from '@common/connect/state/connect-state.store';
import {
    isContextPlaying,
    isSamePlaybackContext,
    PlaybackContext,
} from '@common/connect/state/playback-context';

@Component({
    selector: 'librarybar-list',
    standalone: true,
    templateUrl: './librarybar-list.component.html',
    styleUrl: './librarybar-list.component.scss',
    imports: [
        TranslatePipe,
        PlaylistTypeTranslatePipe,
        MatNavList,
        AsyncPipe,
        NgClass,
        MatIcon,
        ManagerSubjectNameComponent,
    ],
    providers: [LibraryBarService],
})
export class LibraryBarListComponent extends ListEntitiesFacade<LibraryDto> implements OnDestroy {
    private readonly destroy$ = new Subject<void>();

    protected readonly FollowType = FollowType;

    private readonly allowedPaths = new Set<AppRoutes>([
        AppRoutes.album,
        AppRoutes.artist,
        AppRoutes.playlist,
    ]);
    readonly itemViewModels$;

    constructor(
        public readonly libraryBarService: LibraryBarService,
        private readonly navigationService: NavigationService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly mediaPlayerSyncService: MediaPlayerSyncService,
        private readonly followService: FollowService,
        connectStore: ConnectStateStore,
    ) {
        super(libraryBarService);
        this.itemViewModels$ = combineLatest([
            this.dataSource$,
            connectStore.queue$,
            connectStore.player$,
        ]).pipe(
            map(([items, queue, player]) =>
                items.map((item) => {
                    const context = this.getPlaybackContext(item);
                    const isCurrentContext =
                        context !== null && isSamePlaybackContext(queue, context);
                    return {
                        item,
                        context,
                        isCurrentContext,
                        showPause:
                            context !== null && isContextPlaying(player, queue, context),
                    };
                }),
            ),
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        this.subscriptions.push(this.subscribeRouteParams());

        this.followService.onEntitiesChanged$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.libraryBarService.getLibrary());
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();

        this.subscriptions.forEach((elem) => {
            if (elem) {
                elem.unsubscribe();
            }
        });
    }

    navigate(libraryDto: LibraryDto): void {
        this.navigationService.navigateFromLibrary(libraryDto);
    }

    subscribeRouteParams(): Subscription {
        return this.router.events.pipe(startWith(null)).subscribe(() => {
            const child = this.route.firstChild;

            const path = child?.routeConfig?.path ?? null;
            const id =
                path && this.allowedPaths.has(path) ? child?.snapshot?.paramMap?.get('id') : null;

            this.libraryBarService.onSelect(id);
        });
    }

    togglePlayButton(event: Event, item: LibraryDto): void {
        event.stopPropagation();
        const context = this.getPlaybackContext(item);
        if (!context || item.tracks.length === 0) return;

        this.mediaPlayerSyncService
            .playContext(context.sourceId, context.sourceType, item.tracks)
            .catch((error: unknown) => {
                console.error('[Connect v2] library playback context command failed', {
                    sourceId: context.sourceId,
                    sourceType: context.sourceType,
                    error,
                });
            });
    }

    private getPlaybackContext(item: LibraryDto): PlaybackContext | null {
        switch (item.followType) {
            case FollowType.Playlist:
                return { sourceId: item.id, sourceType: 'Playlist' };
            case FollowType.LovedSongs:
                return { sourceId: item.id, sourceType: 'LikedSongs' };
            case FollowType.Album:
            case FollowType.Single:
                return { sourceId: item.id, sourceType: 'Album' };
            default:
                return null;
        }
    }
}
