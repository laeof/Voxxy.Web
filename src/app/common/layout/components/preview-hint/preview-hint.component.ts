import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { locale as english } from './i18n/en';
import { locale as russian } from './i18n/ru';
import { NavigationService } from '@common/services/navigation.service';
import { TranslationLoaderService } from '@common/services/translation-loader.service';

@Component({
    selector: 'preview-hint',
    standalone: true,
    templateUrl: './preview-hint.component.html',
    styleUrl: './preview-hint.component.scss',
    imports: [TranslatePipe],
})
export class PreviewHintComponent {
    constructor(private readonly translationLoaderService: TranslationLoaderService,
        private readonly navigationService: NavigationService
    ) {
        this.translationLoaderService.loadTranslations(english, russian);
    }
    navigateAuth() {
        this.navigationService.navigateLogin();
    }
}
