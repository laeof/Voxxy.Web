import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'artist-manager-common-approved',
    standalone: true,
    templateUrl: './artist-approved.component.html',
    styleUrl: './artist-approved.component.scss',
    imports: [MatIcon, TranslatePipe],
})
export class ArtistManagerCommonApprovedComponent {}
