import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-separator',
    templateUrl: './separator.component.html',
    styleUrl: './separator.component.scss',
    standalone: true,
    imports: [NgClass],
})
export class SeparatorComponent {
    @Input() vertical: boolean = false;
}
