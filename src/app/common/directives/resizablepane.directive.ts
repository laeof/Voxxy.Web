import { Directive, ElementRef, Input, HostBinding } from '@angular/core';

@Directive({
    selector: '[resizablePane]',
    exportAs: 'resizablePane',
})
export class ResizablePaneDirective {
    constructor(public el: ElementRef<HTMLElement>) {}

    @Input() minWidth = 250;
    @Input() maxWidth = Infinity;

    @HostBinding('style.width.px')
    width!: number;

    @HostBinding('style.flexShrink')
    flexShrink = 0;

    setWidth(width: number) {
        this.width = Math.min(this.maxWidth, Math.max(this.minWidth, width));
    }

    get nativeElement() {
        return this.el.nativeElement;
    }
}
