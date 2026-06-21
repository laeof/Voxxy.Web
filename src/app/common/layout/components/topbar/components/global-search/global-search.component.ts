import { AsyncPipe } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { GlobalSearchResult } from '@common/entities/GlobalSearchResult';
import { ListEntitiesFacade } from '@common/facades/list-entities.facade';
import { SearchTypeTranslatePipe } from '@common/pipes/search-type-translation.pipe';
import { GlobalSearchService } from '@common/services/global-search.service';
import { NavigationService } from '@common/services/navigation.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-global-search',
    templateUrl: './global-search.component.html',
    styleUrl: './global-search.component.scss',
    imports: [MatIcon, TranslatePipe, AsyncPipe, SearchTypeTranslatePipe],
})
export class GlobalSearchComponent extends ListEntitiesFacade<GlobalSearchResult> {
    showResults: boolean = false;

    constructor(
        private readonly globalSearchService: GlobalSearchService,
        private readonly navigationService: NavigationService,
    ) {
        super(globalSearchService);
    }

    onSearchInput(query: string): void {
        this.globalSearchService.setSearchQuery(query);
        this.showResults = true;
    }

    onSearchFocus(): void {
        this.showResults = true;
    }

    onResultClick(result: GlobalSearchResult): void {
        this.showResults = false;
        this.navigationService.navigateToSearchResults(result.entityId, result.type);
    }

    @HostListener('document:mousedown', ['$event'])
    onMouseDown(event: MouseEvent) {
        const target = event.target as HTMLElement;

        if (target.closest('app-global-search')) {
            return;
        }

        this.showResults = false;
    }
}
