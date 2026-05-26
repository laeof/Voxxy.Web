import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-manager',
    standalone: true,
    templateUrl: './manager.component.html',
    styleUrl: './manager.component.scss',
})
export class ManagerComponent {
    @Input() subjectImageUrl: string | undefined = undefined;
    @Input() subjectName: string | undefined = undefined;
    @Input() subjectImageRadius: string | undefined = undefined;
}
