import { Component, Input } from '@angular/core';
import { NavGroupComponent } from './vertical/nav-group/nav-group.component';
import { AppNavigationGroup } from '@common/interfaces/navigation.interface';

@Component({
    selector: 'app-navigation',
    templateUrl: './navigation.component.html',
    styleUrl: './navigation.component.scss',
    imports: [NavGroupComponent],
})
export class NavigationComponent {
    @Input() navigationGroups: AppNavigationGroup[] = [];
    @Input() navigationStyle: 'vertical' | 'horizontal' = 'vertical';
}
