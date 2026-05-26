import { Component } from '@angular/core';
import { LibraryBarManagerComponent } from './components/libarybar-manager/librarybar-manager.component';
import { LibraryBarListComponent } from './components/librarybar-list/librarybar-list.component';
import { locale as english } from './i18n/en';
import { locale as russian } from './i18n/ru';
import { LibraryBarAnonymousComponent } from './components/librarybar-anonymous/librarybar-anonymous.component';
import { AppPermissions } from '@common/constants/permissions';
import { AnonymousDirective } from '@common/directives/anonymous.directive';
import { AuthorizeDirective } from '@common/directives/authorize.directive';
import { TranslationLoaderService } from '@common/services/translation-loader.service';

@Component({
    selector: 'layout-librarybar',
    standalone: true,
    templateUrl: './librarybar.component.html',
    styleUrl: './librarybar.component.scss',
    imports: [
        LibraryBarManagerComponent,
        LibraryBarListComponent,
        LibraryBarAnonymousComponent,
        AuthorizeDirective,
        AnonymousDirective,
    ],
    providers: [TranslationLoaderService],
})
export class LibraryBarComponent {
    readonly permissions = AppPermissions;

    constructor(private readonly translationLoaderService: TranslationLoaderService) {
        this.translationLoaderService.loadTranslations(english, russian);
    }
}
