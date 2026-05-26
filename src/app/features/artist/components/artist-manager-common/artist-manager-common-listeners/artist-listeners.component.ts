import { Component, Input } from "@angular/core";
import { TranslatePipe } from "@ngx-translate/core";

@Component({
    selector: 'artist-manager-common-listeners',
    standalone: true,
    templateUrl: './artist-listeners.component.html',
    styleUrl: './artist-listeners.component.scss',
    imports: [TranslatePipe],
})
export class ArtistManagerCommonListenersComponent {
    @Input() listenersPerMonth: number | undefined = undefined;
}