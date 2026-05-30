import { Component, Input } from '@angular/core';
import { FollowButtonComponent } from '@common/components/action-buttons/follow-button/follow-button.component';
import { ManagerSubjectNameComponent } from '@common/components/manager/manager-subject-info/subject-name/subject-name.component';
import { ManagerSubjectTypeComponent } from '@common/components/manager/manager-subject-info/subject-type/subject-type.component';
import { ManagerComponent } from '@common/components/manager/manager.component';
import { UserStateService } from '@common/services/user-state.service';
import { User } from '@features/auth/models/user';

@Component({
    selector: 'app-user-profile-manager',
    templateUrl: './user-profile-manager.component.html',
    imports: [
        ManagerComponent,
        ManagerSubjectNameComponent,
        FollowButtonComponent,
        ManagerSubjectTypeComponent,
    ],
})
export class UserProfileManagerComponent {
    @Input() user: User | undefined = undefined;

    constructor(public readonly userStateService: UserStateService) {}
}
