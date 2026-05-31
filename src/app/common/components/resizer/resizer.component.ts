import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { ResizablePaneDirective } from '@common/directives/resizablepane.directive';

@Component({
    selector: 'app-resizer',
    standalone: true,
    templateUrl: './resizer.component.html',
    styleUrl: './resizer.component.scss',
    imports: [],
})
export class ResizerComponent {
    @Input() left!: ResizablePaneDirective;
    @Input() right!: ResizablePaneDirective;

    @Output() resizeFinished = new EventEmitter<void>();

    private isResizing = false;
    private startX = 0;
    private startLeftWidth = 0;
    private startRightWidth = 0;

    @HostListener('mousedown', ['$event'])
    onMouseDown(event: MouseEvent) {
        event.preventDefault();
        if (!this.left || !this.right) return;

        this.isResizing = true;
        this.startX = event.clientX;

        this.startLeftWidth = this.left.width || this.left.nativeElement.offsetWidth;
        this.startRightWidth = this.right.width || this.right.nativeElement.offsetWidth;
    }

    @HostListener('document:mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {
        if (!this.isResizing || !this.left || !this.right) return;

        let deltaX = event.clientX - this.startX;

        const maxGrowLeft = this.startRightWidth - this.right.minWidth;

        const maxGrowRight = this.startLeftWidth - this.left.minWidth;

        deltaX = Math.min(deltaX, maxGrowLeft);
        deltaX = Math.max(deltaX, -maxGrowRight);

        let newLeftWidth = this.startLeftWidth + deltaX;
        let newRightWidth = this.startRightWidth - deltaX;

        newLeftWidth = Math.max(this.left.minWidth, newLeftWidth);
        newRightWidth = Math.max(this.right.minWidth, newRightWidth);

        this.left.setWidth(newLeftWidth);
        this.right.setWidth(newRightWidth);
    }

    @HostListener('document:mouseup')
    onMouseUp() {
        if (this.isResizing) {
            this.resizeFinished.emit();
            this.isResizing = false;
        }
    }
}
