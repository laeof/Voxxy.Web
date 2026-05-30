import { Component, Input } from '@angular/core';
import { AutoSubjectNameSizeDirective } from '@common/directives/fix-text-height.directive';

@Component({
    selector: 'manager-subject-name',
    templateUrl: './subject-name.component.html',
    styleUrl: './subject-name.component.scss',
    imports: [AutoSubjectNameSizeDirective],
})
export class ManagerSubjectNameComponent {
    @Input() name: string | undefined = undefined;
    @Input() rootSelector: string | null | undefined = '.manager-wrapper';
    @Input() rootImageSelector: string | null | undefined = '.subject-cover-wrapper';
    @Input() rootNameSelector: string | null | undefined = '.subject-info-wrapper';
    @Input() maxFontSize: number = 96;
    @Input() minFontSize: number = 16;
    @Input() maxLines: number = 3;
}
