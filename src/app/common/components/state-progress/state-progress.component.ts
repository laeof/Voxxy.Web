import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-state-progress',
    templateUrl: './state-progress.component.html',
    styleUrl: './state-progress.component.scss',
})
export class StateProgressComponent {
    @Input() currentState: number = 0;
    @Input() maxState: number = 0;
    circumference: number = 2 * Math.PI * 45;

    get progress(): number {
        return ((this.currentState + 1) / this.maxState) * 100;
    }

    get progressNext(): number {
        return ((this.currentState + 2) / this.maxState) * 100;
    }

    get dashOffset(): number {
        return this.circumference * (1 - this.progress / 100);
    }

    get dashNextOffset(): number {
        return this.circumference * (1 - this.progressNext / 100);
    }

    getPercentage(): string {
        return `${Math.round(this.progress)}`;
    }
}
