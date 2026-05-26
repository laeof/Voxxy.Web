import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'action-follow-button',
    templateUrl: './follow-button.component.html',
    styleUrl: './follow-button.component.scss',
    imports: [TranslatePipe],
})
export class FollowButtonComponent {
    //fixme implement follow button logic
}
