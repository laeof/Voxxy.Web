import { Component, OnInit } from '@angular/core';
import { NavigationComponent } from '@common/components/navigation/navigation.component';
import { TranslationLoaderService } from '@common/services/translation-loader.service';
import { locale as english } from './i18n/en';
import { locale as russian } from './i18n/ru';
import { RouterOutlet } from '@angular/router';
import { forArtistNavigation } from '@common/constants/for-artist-navigation.constant';
import { ForArtistLogoComponent } from './components/logo/for-artist-logo.component';
import { ResizerComponent } from '@common/components/resizer/resizer.component';
import { ResizablePaneDirective } from '@common/directives/resizablepane.directive';
import { Artist } from '@features/artist/models/artist';
import { ForArtistProfileComponent } from './components/artist-profile/artist-profile.component';
import { SeparatorComponent } from '@common/components/separator/separator.component';
import { ArtistStateService } from '@common/services/artist-state.service';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-for-artist',
    standalone: true,
    templateUrl: './for-artist.component.html',
    styleUrl: './for-artist.component.scss',
    imports: [
        NavigationComponent,
        RouterOutlet,
        ForArtistLogoComponent,
        ResizerComponent,
        ResizablePaneDirective,
        ForArtistProfileComponent,
        SeparatorComponent,
        AsyncPipe
    ],
})
export class ForArtistComponent implements OnInit {
    navigationGroups = forArtistNavigation.navigationGroups;
    artists$: Observable<Artist[]>;

    constructor(
        private readonly translationLoaderService: TranslationLoaderService,
        private readonly artistStateService: ArtistStateService,
    ) {
        this.artists$ = this.artistStateService.changes$;
    }

    ngOnInit() {
        this.translationLoaderService.loadTranslations(english, russian);
    }
}
