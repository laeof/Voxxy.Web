import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatNavList } from '@angular/material/list';
import { TranslatePipe } from '@ngx-translate/core';
import { ListEntitiesFacade } from '../../../../../common/facades/list-entities.facade';
import { LibraryDto } from './dtos/library-dto';
import { LibraryBarService } from '../services/librarybar.service';
import { PlaylistTypeTranslatePipe } from '../../../../../common/pipes/playlist-type-translation.pipe';
import { AsyncPipe, NgClass } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { NavigationService } from '../../../../../common/services/navigation.service';
import { startWith, Subject, Subscription, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AppRoutes } from '../../../../../common/constants/app.routes.constant';
import { FollowType } from '../../enums/follow-type-enum';

@Component({
    selector: 'librarybar-list',
    standalone: true,
    templateUrl: './librarybar-list.component.html',
    styleUrl: './librarybar-list.component.scss',
    imports: [TranslatePipe, PlaylistTypeTranslatePipe, MatNavList, AsyncPipe, NgClass, MatIcon],
    providers: [LibraryBarService],
})
export class LibraryBarListComponent
    extends ListEntitiesFacade<LibraryDto>
    implements OnInit, OnDestroy

{
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
        private readonly router: Router
    ) {
        super(libraryBarService);

        this.subscriptions.push(this.subscribeRouteParams());
    }

    ngOnInit(): void {
        this.libraryBarService.getLibrary().pipe(takeUntil(this.destroy$)).subscribe();
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
}
