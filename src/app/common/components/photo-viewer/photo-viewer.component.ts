import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-photo-viewer',
    templateUrl: './photo-viewer.component.html',
    styleUrl: './photo-viewer.component.scss',
    imports: [NgClass, MatIcon],
})
export class PhotoViewerComponent {
    @Input() imageUrl: string = '';
    @Input() isVisible: boolean = false;
    @Input() heightPercentage: number = 65;

    @Output() closed = new EventEmitter<void>();

    close(): void {
        this.isVisible = false;
        this.closed.emit();
    }
}
