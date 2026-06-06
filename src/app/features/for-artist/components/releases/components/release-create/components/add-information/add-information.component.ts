import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SubjectInputComponent } from '@common/components/subject-input/subject-input.component';
import { SeparatorComponent } from '@common/components/separator/separator.component';
import { SubjectTextareaComponent } from '@common/components/subject-textarea/subject-textarea.component';
import { SubjectImageUploadComponent } from '@common/components/subject-image-upload/subject-image-upload.component';

@Component({
    selector: 'for-artist-release-create-add-information',
    standalone: true,
    templateUrl: './add-information.component.html',
    styleUrl: './add-information.component.scss',
    imports: [
        TranslatePipe,
        SubjectInputComponent,
        SeparatorComponent,
        SubjectTextareaComponent,
        SubjectImageUploadComponent,
    ],
})
export class AddInformationComponent {}
