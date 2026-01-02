import { Component } from '@angular/core';
import { LibraryBarComponent } from './components/librarybar/librarybar.component';
import { NowPlayingBarComponent } from './components/nowplayingbar/nowplayingbar.component';
import { TopBarComponent } from './components/topbar/topbar.component';
import { PlayerBarComponent } from './components/playerbar/playerbar.component';
import { ContentComponent } from './components/content/content.component';
import { QueueBarComponent } from './components/queuebar/queuebar.component';
import { ResizerComponent } from '../common/components/resizer/resizer.component';
import { ResizablePaneDirective } from '../common/directives/resizablepane.directive';
import { ToggleBarService } from './services/togglebar.service';
import { AppPermissions } from '../common/constants/permissions';
import { PreviewHintComponent } from './components/preview-hint/preview-hint.component';
import { AuthorizeDirective } from '../common/directives/authorize.directive';
import { AnonymousDirective } from '../common/directives/anonymous.directive';
import { ProgressBarComponent } from '../common/components/progress-bar/progress-bar.component';

@Component({
    selector: 'app-layout',
    standalone: true,
    templateUrl: './layout.component.html',
    styleUrl: './layout.component.scss',
    imports: [
        TopBarComponent,
        LibraryBarComponent,
        NowPlayingBarComponent,
        PlayerBarComponent,
        QueueBarComponent,
        ContentComponent,
        ResizerComponent,
        ResizablePaneDirective,
        PreviewHintComponent,
        AuthorizeDirective,
        AnonymousDirective,
        ProgressBarComponent,
    ],
    providers: [ToggleBarService],
})
export class LayoutComponent {
    readonly permissions = AppPermissions;
    constructor(public toggleBarService: ToggleBarService) {}
}
