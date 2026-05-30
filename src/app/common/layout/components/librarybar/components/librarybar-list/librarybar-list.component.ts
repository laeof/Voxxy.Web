import { Component, effect, OnDestroy, OnInit } from '@angular/core';
import { MatNavList } from '@angular/material/list';
import { TranslatePipe } from '@ngx-translate/core';
import { LibraryDto } from './dtos/library-dto';
import { LibraryBarService } from '../services/librarybar.service';
import { AsyncPipe, NgClass } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { startWith, Subject, Subscription, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { FollowType } from '../../enums/follow-type-enum';
import { AppRoutes } from '@common/constants/app.routes.constant';
import { ListEntitiesFacade } from '@common/facades/list-entities.facade';
import { PlaylistTypeTranslatePipe } from '@common/pipes/playlist-type-translation.pipe';
import { MediaPlayerStateService } from '@common/services/media-player-state.service';
import { NavigationService } from '@common/services/navigation.service';
import { FollowService } from '@common/services/follow-service';
import { AutoSubjectNameSizeDirective } from '@common/directives/fix-text-height.directive';
import { ManagerSubjectNameComponent } from '@common/components/manager/manager-subject-info/subject-name/subject-name.component';

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

    constructor(
        public readonly libraryBarService: LibraryBarService,
        private readonly navigationService: NavigationService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        public readonly mediaPlayerStateService: MediaPlayerStateService,
        private readonly followService: FollowService,
    ) {
        super(libraryBarService);

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

    togglePlayButton(playlist: LibraryDto) {
        if (this.mediaPlayerStateService.currentTrack?.fromPlaylist === playlist?.id) {
            this.mediaPlayerStateService.playing
                ? this.mediaPlayerStateService.pause()
                : this.mediaPlayerStateService.play();
            return;
        }

        this.mediaPlayerStateService.playQueue(playlist.tracks || [], 0);
    }
}
