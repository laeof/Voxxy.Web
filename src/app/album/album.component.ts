import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlbumService } from './services/album.service';
import { TranslationLoaderService } from '../common/services/translation-loader.service';
import { locale as english } from './i18n/en';
import { locale as russian } from './i18n/ru';
import { map, Observable, Subject, takeUntil } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { TrackListSkeletonComponent } from '../track-list/track-list-skeleton/track-list-skeleton.component';
import { Album } from './models/album';
import { AlbumManagerComponent } from './components/album-manager/album-manager.component';
import { AlbumTrackListComponent } from './components/album-track-list/album-track-list.component';
import { ManagerSkeletonComponent } from '../skeleton/manager-skeleton/manager-skeleton.component';

@Component({
    selector: 'app-album',
    standalone: true,
    templateUrl: './album.component.html',
    styleUrl: './album.component.scss',
    providers: [AlbumService],
    imports: [
        AsyncPipe,
        TrackListSkeletonComponent,
        AlbumManagerComponent,
        AlbumTrackListComponent,
        ManagerSkeletonComponent,
    ],
})
export class AlbumComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
    private playlistId: string | null = null;

    currentOpenedAlbum$: Observable<Album | undefined>;

    constructor(
        public readonly albumService: AlbumService,
        private readonly translationLoaderService: TranslationLoaderService,
        private readonly route: ActivatedRoute
    ) {
        this.translationLoaderService.loadTranslations(english, russian);

        this.currentOpenedAlbum$ = this.albumService.onEntitiesChanged$.pipe(
            map((albums) => (albums.length > 0 ? albums[0] : undefined))
        );
    }

    ngOnInit(): void {
        this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
            this.playlistId = params.get('id');
            if (this.playlistId != null) {
                this.albumService.getAlbumById(this.playlistId);
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
