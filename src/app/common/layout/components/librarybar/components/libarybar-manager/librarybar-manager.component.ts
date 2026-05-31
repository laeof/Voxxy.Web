import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { AppPermissions } from '@common/constants/permissions';
import { AnonymousDirective } from '@common/directives/anonymous.directive';
import { AuthorizeDirective } from '@common/directives/authorize.directive';
import { ToggleBarService } from '@common/layout/services/togglebar.service';
import { Subject, takeUntil } from 'rxjs';
import { NgClass } from '@angular/common';

@Component({
    selector: 'librarybar-manager',
    standalone: true,
    templateUrl: './librarybar-manager.component.html',
    styleUrl: './librarybar-manager.component.scss',
    imports: [TranslatePipe, MatIcon, AuthorizeDirective, AnonymousDirective, NgClass],
})
export class LibraryBarManagerComponent implements OnInit, OnDestroy {
    readonly permissions = AppPermissions;

    public libraryBarExpanded: boolean = false;

    private readonly destroy$ = new Subject<void>();

    constructor(private readonly toggleBarService: ToggleBarService) {}

    toggleLibraryBar(): void {
        this.toggleBarService.toggleLibraryBar();
    }

    ngOnInit(): void {
        this.toggleBarService.libraryBarExpanded$
            .pipe(takeUntil(this.destroy$))
            .subscribe((expanded: boolean) => {
                this.libraryBarExpanded = expanded;
                if (!expanded) {
                    this.toggleBarService.resizeLibraryBar(65);
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
