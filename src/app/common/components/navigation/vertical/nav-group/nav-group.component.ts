import { Component, Input, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { AppNavigationGroup } from '@common/interfaces/navigation.interface';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { NavigationService } from '@common/services/navigation.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

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

    constructor(
        private readonly navigationService: NavigationService,
        private readonly router: Router,
        private readonly activatedRoute: ActivatedRoute,
    ) {}

    ngOnInit(): void {
        this.isExpandAllowed = this.navigationGroup?.groupItems.length !== 0;

        this.updateSelectedState();

        this.router.events
            .pipe(filter((event) => event instanceof NavigationEnd))
            .subscribe(() => this.updateSelectedState());
    }

    private updateSelectedState(): void {
        const urlSegments = this.router.url.split('?')[0].split('/').filter(Boolean);

        const itemRoute = this.navigationGroup?.route;

        this.isSelected = !!itemRoute && urlSegments.includes(itemRoute);
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
