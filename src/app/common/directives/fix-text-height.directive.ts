import {
    AfterViewInit,
    Directive,
    ElementRef,
    Input,
    NgZone,
    OnChanges,
    OnDestroy,
    SimpleChanges,
} from '@angular/core';

@Directive({
    selector: '[appAutoSubjectNameSize]',
    standalone: true,
})
export class AutoSubjectNameSizeDirective implements AfterViewInit, OnChanges, OnDestroy {
    @Input() appAutoSubjectNameSize: string | null | undefined;
    @Input() rootSelector: string | null | undefined;
    @Input() rootImageSelector: string | null | undefined;
    @Input() rootNameSelector: string | null | undefined;

    @Input() maxFontSize = 96;
    @Input() minFontSize = 16;
    @Input() maxLines = 3;

    private resizeObserver?: ResizeObserver;
    private mutationObserver?: MutationObserver;
    private rafId: number | null = null;

    constructor(
        private readonly elementRef: ElementRef<HTMLElement>,
        private readonly zone: NgZone,
    ) {}

    ngAfterViewInit(): void {
        const host = this.elementRef.nativeElement;

        this.zone.runOutsideAngular(() => {
            this.prepareHost(host);

            this.resizeObserver = new ResizeObserver(() => {
                this.scheduleFit();
            });

            this.mutationObserver = new MutationObserver(() => {
                this.scheduleFit();
            });

            this.resizeObserver.observe(host);

            const root = host.parentElement;
            if (root) {
                this.resizeObserver.observe(root);

                Array.from(root.children).forEach((child) => {
                    this.resizeObserver?.observe(child);
                });

                this.mutationObserver.observe(root, {
                    childList: true,
                    subtree: true,
                    characterData: true,
                });
            }

            document.fonts?.ready.then(() => this.scheduleFit());

            this.scheduleFit();
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['appAutoSubjectNameSize']) {
            this.scheduleFit();
        }
    }

    ngOnDestroy(): void {
        this.resizeObserver?.disconnect();
        this.mutationObserver?.disconnect();

        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
        }
    }

    private scheduleFit(): void {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
        }

        this.rafId = requestAnimationFrame(() => {
            this.rafId = null;
            this.fit();
        });
    }

    private fit(): void {
        const host = this.elementRef.nativeElement;
        const root = host.parentElement;

        if (!root) {
            return;
        }

        const image = this.findImage(root);

        if (!image) {
            return;
        }

        const imageHeight = image.getBoundingClientRect().height;

        const siblingsHeight = Array.from(this.getRootElement()?.children || [])
            .filter((child) => child !== host.parentElement)
            .reduce((sum, child) => {
                return sum + child.getBoundingClientRect().height;
            }, 0);

        const availableHeight = Math.max(0, imageHeight - siblingsHeight);

        if (availableHeight <= 0) {
            host.style.fontSize = `${this.minFontSize}px`;
            return;
        }

        host.style.maxHeight = `${availableHeight}px`;

        const bestFontSize = this.findBestFontSize(host, availableHeight);

        host.style.fontSize = `${bestFontSize}px`;
    }

    private findBestFontSize(host: HTMLElement, availableHeight: number): number {
        let low = this.minFontSize;
        let high = this.maxFontSize;
        let best = this.minFontSize;

        for (let i = 0; i < 12; i++) {
            const mid = (low + high) / 2;

            host.style.fontSize = `${mid}px`;

            if (this.fits(host, availableHeight)) {
                best = mid;
                low = mid;
            } else {
                high = mid;
            }
        }

        return Math.floor(best);
    }

    private fits(host: HTMLElement, availableHeight: number): boolean {
        const rects = Array.from(host.getClientRects());

        const lineCount = this.getLineCount(rects);

        if (lineCount > this.maxLines) {
            return false;
        }

        if (host.scrollHeight > availableHeight + 1) {
            return false;
        }

        if (host.scrollWidth > host.clientWidth + 1) {
            return false;
        }

        return true;
    }

    private getLineCount(rects: DOMRect[]): number {
        if (rects.length === 0) {
            return 1;
        }

        const tops = new Set<number>();

        for (const rect of rects) {
            tops.add(Math.round(rect.top));
        }

        return tops.size;
    }

    private prepareHost(host: HTMLElement): void {
        host.style.width = '100%';
        host.style.overflow = 'hidden';
        host.style.display = '-webkit-box';

        host.style.lineHeight = '1';
        host.style.whiteSpace = 'normal';
        host.style.wordBreak = 'break-word';
        host.style.webkitLineClamp = String(this.maxLines);

        host.style.webkitBoxOrient = 'vertical';
    }

    private findImage(root: HTMLElement): HTMLElement | null | undefined {
        return root
            .closest(this.rootSelector ? this.rootSelector : '')
            ?.querySelector(this.rootImageSelector ? this.rootImageSelector : '');
    }

    private getRootElement(): HTMLElement | null {
        return this.elementRef.nativeElement.closest(
            this.rootNameSelector ? this.rootNameSelector : '',
        ) as HTMLElement | null;
    }
}
