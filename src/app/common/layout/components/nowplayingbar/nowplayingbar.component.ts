import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { NowPlayingBarManagerComponent } from './nowplayingbar-manager/nowplayingbar-manager.component';
import { ToggleBarService } from '@common/layout/services/togglebar.service';
import { NowPlayingBarOverlayComponent } from './nowplayingbar-overlay/nowplayingbar-overlay.component';
import { Subject, takeUntil } from 'rxjs';
import { SidebarValues } from '@common/constants/sidebar.values.constant';

@Component({
    selector: 'layout-nowplayingbar',
    standalone: true,
    templateUrl: './nowplayingbar.component.html',
    styleUrl: './nowplayingbar.component.scss',
    imports: [NowPlayingBarManagerComponent, NowPlayingBarOverlayComponent],
})
export class NowPlayingBarComponent implements AfterViewInit, OnInit {
    public nowPlayingBarExpanded: boolean = false;
    private readonly destroy$ = new Subject<void>();

    constructor(
        private readonly elementRef: ElementRef,
        private readonly toggleBarService: ToggleBarService,
    ) {}

    ngAfterViewInit(): void {
        this.loadDefaults();
    }

    ngOnInit(): void {
        this.toggleBarService.nowPlayingBarExpanded$
            .pipe(takeUntil(this.destroy$))
            .subscribe((expanded: boolean) => {
                this.nowPlayingBarExpanded = expanded;
                if (!expanded) {
                    this.toggleBarService.resizeNowPlayingBar(
                        SidebarValues.nowPlayingBarHidedWidth,
                    );
                }
            });
    }

    loadDefaults(): void {
        const hostElement = this.elementRef.nativeElement;
        this.toggleBarService.nowPlayingBarWidth$.subscribe((width: number) => {
            hostElement.style.width = width + 'px';
        });
    }
}
