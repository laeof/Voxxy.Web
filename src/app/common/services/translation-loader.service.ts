import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export interface Locale {
    lang: string;
    data: any;
}

@Injectable({
    providedIn: 'root',
})
export class TranslationLoaderService {
    constructor(private readonly translateService: TranslateService) {}

    loadTranslations(...args: Locale[]): void {
        const locales = [...args];

        locales.forEach((locale) => {
            this.translateService.setTranslation(locale.lang, locale.data, true);
        });
    }
}
