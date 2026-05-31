import { Component, OnDestroy } from '@angular/core';
import { LibraryBarComponent } from './components/librarybar/librarybar.component';
import { NowPlayingBarComponent } from './components/nowplayingbar/nowplayingbar.component';
import { TopBarComponent } from './components/topbar/topbar.component';
import { PlayerBarComponent } from './components/playerbar/playerbar.component';
import { ContentComponent } from './components/content/content.component';
import { QueueBarComponent } from './components/queuebar/queuebar.component';
import { ToggleBarService } from './services/togglebar.service';
import { PreviewHintComponent } from './components/preview-hint/preview-hint.component';
import { ProgressBarComponent } from '@common/components/progress-bar/progress-bar.component';
import { ResizerComponent } from '@common/components/resizer/resizer.component';
import { AppPermissions } from '@common/constants/permissions';
import { AnonymousDirective } from '@common/directives/anonymous.directive';
import { AuthorizeDirective } from '@common/directives/authorize.directive';
import { ResizablePaneDirective } from '@common/directives/resizablepane.directive';
import { NgClass } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { SidebarValues } from '@common/constants/sidebar.values.constant';

@Component({
    selector: 'app-layout',
    standalone: true,
    templateUrl: './layout.component.html',
    styleUrl: './layout.component.scss',
    imports: [
        TopBarComponent,
        LibraryBarComponent,
        NowPlayingBarComponent,
        PlayerBarComponent,
        QueueBarComponent,
        ContentComponent,
        ResizerComponent,
        ResizablePaneDirective,
        PreviewHintComponent,
        AuthorizeDirective,
        AnonymousDirective,
        ProgressBarComponent,
        NgClass,
    ],
    providers: [ToggleBarService],
})
export class LayoutComponent implements OnDestroy {
    public readonly permissions = AppPermissions;
    private readonly destroy$ = new Subject<void>();

    public queueBarExpanded: boolean = false;
    public nowPlayingBarExpanded: boolean = false;
    public libraryBarExpanded: boolean = false;

    constructor(public readonly toggleBarService: ToggleBarService) {
        this.toggleBarService.queueBarExpanded$
            .pipe(takeUntil(this.destroy$))
            .subscribe((expanded: boolean) => {
                this.queueBarExpanded = expanded;
            });
        this.toggleBarService.nowPlayingBarExpanded$
            .pipe(takeUntil(this.destroy$))
            .subscribe((expanded: boolean) => {
                this.nowPlayingBarExpanded = expanded;
                if (!expanded) {
                    this.toggleBarService.resizeNowPlayingBar(SidebarValues.nowPlayingBarHidedWidth);
                }
            });
        this.toggleBarService.libraryBarExpanded$
            .pipe(takeUntil(this.destroy$))
            .subscribe((expanded: boolean) => {
                this.libraryBarExpanded = expanded;
                if (!expanded) {
                    this.toggleBarService.resizeLibraryBar(SidebarValues.libraryBarMinWidth);
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
