import { ListEntitiesFacade } from '@common/facades/list-entities.facade';
import { Artist } from './models/artist';
import { ArtistService } from './services/artist.service';
import { TranslationLoaderService } from '@common/services/translation-loader.service';
import { locale as english } from './i18n/en';
import { locale as russian } from './i18n/ru';
import { Component, OnInit } from '@angular/core';
import { first, map, Observable, Subject, takeUntil } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ArtistManagerComponent } from "./components/artist-manager/artist-manager.component";
import { ManagerSkeletonComponent } from '@common/components/manager/manager-skeleton/manager-skeleton.component';

@Component({
    selector: 'app-artist',
    standalone: true,
    templateUrl: './artist.component.html',
    providers: [ArtistService],
    imports: [AsyncPipe, ArtistManagerComponent, ManagerSkeletonComponent],
})
export class ArtistComponent extends ListEntitiesFacade<Artist> implements OnInit {
    private readonly destroy$ = new Subject<void>();

    public readonly currentOpenedArtist$: Observable<Artist | undefined>;

    constructor(
        private readonly artistService: ArtistService,
        private readonly translationLoaderService: TranslationLoaderService,
        private readonly route: ActivatedRoute,
    ) {
        super(artistService);

        this.translationLoaderService.loadTranslations(english, russian);

        this.currentOpenedArtist$ = this.artistService.onEntitiesChanged$.pipe(
            map((artists) => (artists.length > 0 ? artists[0] : undefined)),
        );
    }

    ngOnInit(): void {
        this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
            let id = params.get('id');
            if (id != null) {
                this.artistService.getArtistById(id);
            }
        });
    }

    logartist() {
        this.artistService.onEntitiesChanged$.pipe(first()).subscribe((v) => console.log(v));
    }
}
