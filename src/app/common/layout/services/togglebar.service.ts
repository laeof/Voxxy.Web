import { Injectable } from '@angular/core';
import { SidebarValues } from '@common/constants/sidebar.values.constant';
import { LocalStorageService } from '@common/services/local-storage.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ToggleBarService {
    private readonly isNowPlayingBarExpanded = new BehaviorSubject<boolean>(false);
    private readonly isQueueBarExpanded = new BehaviorSubject<boolean>(false);
    private readonly isLibraryBarExpanded = new BehaviorSubject<boolean>(false);
    private readonly libraryBarWidth = new BehaviorSubject<number>(250);
    private readonly nowPlayingBarWidth = new BehaviorSubject<number>(250);

    public readonly nowPlayingBarExpanded$ = this.isNowPlayingBarExpanded.asObservable();
    public readonly queueBarExpanded$ = this.isQueueBarExpanded.asObservable();
    public readonly libraryBarExpanded$ = this.isLibraryBarExpanded.asObservable();
    public readonly libraryBarWidth$ = this.libraryBarWidth.asObservable();
    public readonly nowPlayingBarWidth$ = this.nowPlayingBarWidth.asObservable();

    constructor(private readonly localStorage: LocalStorageService) {
        this.initDefaults();
    }

    initDefaults() {
        const libraryBarState = this.getLibraryBarState();
        this.isLibraryBarExpanded.next(libraryBarState);

        const nowPlayingBarState = this.getNowPlayingBarState();
        this.isNowPlayingBarExpanded.next(nowPlayingBarState);

        const queueBarState = this.getQueueBarState();
        this.isQueueBarExpanded.next(queueBarState);

        const libraryBarWidth = this.getLibraryBarWidth();
        this.libraryBarWidth.next(libraryBarWidth);

        const nowPlayingBarWidth = this.getNowPlayingBarWidth();
        this.nowPlayingBarWidth.next(nowPlayingBarWidth);

        this.nowPlayingBarExpanded$.subscribe((expanded: boolean) => {
            this.localStorage.setItem(
                SidebarValues.nowPlayingBarExpandedState,
                expanded.toString(),
            );
        });
        this.queueBarExpanded$.subscribe((expanded: boolean) => {
            this.localStorage.setItem(SidebarValues.queueBarExpandedState, expanded.toString());
        });
        this.libraryBarExpanded$.subscribe((expanded: boolean) => {
            this.localStorage.setItem(SidebarValues.libraryBarExpandedState, expanded.toString());
        });
        this.libraryBarWidth$.subscribe((width: number) => {
            this.localStorage.setItem(SidebarValues.libraryBarWidth, width.toString());
        });
        this.nowPlayingBarWidth$.subscribe((width: number) => {
            this.localStorage.setItem(SidebarValues.nowPlayingBarWidth, width.toString());
        });
    }

    resizeLibraryBar(width: number) {
        this.libraryBarWidth.next(width);

        if (width > SidebarValues.libraryBarMinWidth) {
            this.isLibraryBarExpanded.next(true);
        }
    }

    toggleLibraryBar(): void {
        this.isLibraryBarExpanded.next(!this.isLibraryBarExpanded.value);
    }

    resizeNowPlayingBar(width: number) {
        this.nowPlayingBarWidth.next(width);
    }

    toggleNowPlayingBar(): void {
        this.isNowPlayingBarExpanded.next(!this.isNowPlayingBarExpanded.value);
    }

    toggleQueueBar(): void {
        this.isQueueBarExpanded.next(!this.isQueueBarExpanded.value);
    }

    private getLibraryBarWidth(): number {
        const width = this.localStorage.getItem(SidebarValues.libraryBarWidth);
        return width ? Number.parseInt(width, 10) : 250;
    }

    private getNowPlayingBarWidth(): number {
        const width = this.localStorage.getItem(SidebarValues.nowPlayingBarWidth);
        return width ? Number.parseInt(width, 10) : 250;
    }

    private getLibraryBarState(): boolean {
        const state = this.localStorage.getItem(SidebarValues.libraryBarExpandedState);
        return state === 'true';
    }

    private getNowPlayingBarState(): boolean {
        const state = this.localStorage.getItem(SidebarValues.nowPlayingBarExpandedState);
        return state === 'true';
    }

    private getQueueBarState(): boolean {
        const state = this.localStorage.getItem(SidebarValues.queueBarExpandedState);
        return state === 'true';
    }
}
