import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { AppPermissions } from '@common/constants/permissions';
import { AnonymousDirective } from '@common/directives/anonymous.directive';
import { AuthorizeDirective } from '@common/directives/authorize.directive';

@Component({
    selector: 'librarybar-manager',
    standalone: true,
    templateUrl: './librarybar-manager.component.html',
    styleUrl: './librarybar-manager.component.scss',
    imports: [TranslatePipe, MatIcon, AuthorizeDirective, AnonymousDirective],
})
export class LibraryBarManagerComponent {
    readonly permissions = AppPermissions;
}
