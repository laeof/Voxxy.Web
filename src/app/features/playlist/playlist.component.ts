import { Component, OnDestroy, OnInit } from '@angular/core';
import { PlaylistManagerComponent } from './components/playlist-manager/playlist-manager.component';
import { Playlist } from './models/playlist';
import { PlaylistService } from './services/playlist.service';
import { ActivatedRoute } from '@angular/router';
import { map, Observable, Subject, takeUntil } from 'rxjs';
import { locale as english } from './i18n/en';
import { locale as russian } from './i18n/ru';
import { locale as ukrainian } from './i18n/ua';
import { AsyncPipe } from '@angular/common';
import { ManagerSkeletonComponent } from '@common/components/manager/manager-skeleton/manager-skeleton.component';
import { TrackListSkeletonComponent } from '@common/components/track-list/track-list-skeleton/track-list-skeleton.component';
import { TranslationLoaderService } from '@common/services/translation-loader.service';
import { PlaylistTrackListComponent } from './components/playlist-track-list/playlist-track-list.component';

@Component({
    selector: 'app-playlist',
    standalone: true,
    templateUrl: './playlist.component.html',
    imports: [
        PlaylistManagerComponent,
        ManagerSkeletonComponent,
        AsyncPipe,
        TrackListSkeletonComponent,
        PlaylistTrackListComponent,
    ],
    providers: [PlaylistService, TranslationLoaderService],
})
export class PlaylistComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();

    currentOpenedPlaylist$: Observable<Playlist | undefined>;

    private playlistId: string | null = null;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly playlistService: PlaylistService,
        private readonly translationLoaderService: TranslationLoaderService
    ) {
        this.translationLoaderService.loadTranslations(english, russian, ukrainian);

        this.currentOpenedPlaylist$ = this.playlistService.onEntitiesChanged$.pipe(
            map((playlists) => (playlists.length > 0 ? playlists[0] : undefined))
        );
    }

    ngOnInit(): void {
        this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
            this.playlistId = params.get('id');
            if (this.playlistId != null) {
                this.playlistService.getPlaylistById(this.playlistId);
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
