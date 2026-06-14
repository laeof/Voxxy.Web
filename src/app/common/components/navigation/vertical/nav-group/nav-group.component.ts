import { Component, Input, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { AppNavigationGroup } from '@common/interfaces/navigation.interface';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { NavigationService } from '@common/services/navigation.service';

@Component({
    selector: 'navigation-group',
    templateUrl: './nav-group.component.html',
    styleUrl: './nav-group.component.scss',
    standalone: true,
    imports: [NgClass, MatIcon, TranslatePipe],
})
export class NavGroupComponent implements OnInit {
    @Input() navigationGroup: AppNavigationGroup | null = null;

    isExpanded: boolean = false;
    isExpandAllowed: boolean = false;
    isSelected: boolean = false;

    constructor(private readonly navigationService: NavigationService) {}

    ngOnInit(): void {
        this.isExpandAllowed = this.navigationGroup?.groupItems.length !== 0;

        this.updateSelectedState();

        this.navigationService.navigationEndSubscribe(() => this.updateSelectedState());
    }

    private updateSelectedState(): void {
        const urlSegments = this.navigationService.currentUrl
            .split('?')[0]
            .split('/')
            .filter(Boolean);

        const itemRoute = this.navigationGroup?.route;

        this.isSelected = !!itemRoute && urlSegments.includes(itemRoute);
        this.isExpanded = this.isSelected || false;
    }

    toggleGroupExpanded(): void {
        if (!this.isExpandAllowed) {
            this.navigateTo(this.navigationGroup);
            return;
        }

        this.isExpanded = !this.isExpanded;
    }

    navigateTo(item: AppNavigationGroup | null): void {
        if (item == null) {
            return;
        }

        this.navigationService.navigateForArtist(item.groupTitle);
    }
}
