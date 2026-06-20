import { Artist } from './models/artist';
import { ArtistService } from './services/artist.service';
import { TranslationLoaderService } from '@common/services/translation-loader.service';
import { locale as english } from './i18n/en';
import { locale as russian } from './i18n/ru';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ArtistManagerComponent } from './components/artist-manager/artist-manager.component';
import { ManagerSkeletonComponent } from '@common/components/manager/manager-skeleton/manager-skeleton.component';
import { Track } from '@features/track/models/track';
import { Album } from '@features/album/models/album';
import { ArtistPopularTrackListComponent } from './components/artist-popular-track-list/artist-popular-track-list.component';
import { TitleSectionComponent } from '@common/components/title-section/title-section.component';
import { TranslatePipe } from '@ngx-translate/core';
import { ArtistPopularTrackService } from './services/artist-popular-track.service';
import { SingleEntityFacade } from '@common/facades/single-entity.facade';
import { TrackListSkeletonComponent } from '@common/components/track-list/track-list-skeleton/track-list-skeleton.component';

@Component({
    selector: 'app-artist',
    standalone: true,
    templateUrl: './artist.component.html',
    providers: [ArtistService, ArtistPopularTrackService],
    imports: [
        AsyncPipe,
        ArtistManagerComponent,
        ManagerSkeletonComponent,
        ArtistPopularTrackListComponent,
        TitleSectionComponent,
        TranslatePipe,
        TrackListSkeletonComponent,
    ],
})
export class ArtistComponent extends SingleEntityFacade<Artist> implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();

    dataSource: Track[] = [];
    playlistId: string | undefined = undefined;

    constructor(
        private readonly artistService: ArtistService,
        private readonly translationLoaderService: TranslationLoaderService,
        private readonly route: ActivatedRoute,
    ) {
        super(artistService);

        this.translationLoaderService.loadTranslations(english, russian);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    ngOnInit(): void {
        this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
            let id = params.get('id');
            if (id != null) {
                this.artistService.getArtistById(id);
            }
        });

        this.entity$.pipe(takeUntil(this.destroy$)).subscribe((artist) => {
            //fixme temporary solution, need to be fixed after backend changes
            this.dataSource = artist?.albums
                ?.filter((album) => album.tracks.length !== 0)
                ?.flatMap((album: Album) => {
                    this.playlistId = album.id;
                    album.tracks.forEach((track) => {
                        track.fromPlaylist = album.id;
                        track.artists = [artist];
                    });
                    return album.tracks;
                })!;
        });
    }
}
