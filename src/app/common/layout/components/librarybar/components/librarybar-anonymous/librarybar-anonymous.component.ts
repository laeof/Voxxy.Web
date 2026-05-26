import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { locale as english } from '../../i18n/en';
import { locale as russian } from '../../i18n/ru';
import { TranslationLoaderService } from '@common/services/translation-loader.service';

@Component({
    selector: 'librarybar-anonymous',
    standalone: true,
    templateUrl: './librarybar-anonymous.component.html',
    styleUrl: './librarybar-anonymous.component.scss',
    imports: [TranslatePipe],
})
export class LibraryBarAnonymousComponent {
    constructor(private readonly translationLoaderService: TranslationLoaderService) {
        this.translationLoaderService.loadTranslations(english, russian);
    }
}
