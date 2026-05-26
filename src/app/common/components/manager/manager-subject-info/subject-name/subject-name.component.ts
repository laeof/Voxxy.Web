import { Component, Input } from '@angular/core';

@Component({
    selector: 'manager-subject-name',
    templateUrl: './subject-name.component.html',
    styleUrl: './subject-name.component.scss',
})
export class ManagerSubjectNameComponent {
    @Input() name: string | undefined = undefined;
}
