import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Artist } from '@features/artist/models/artist';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'for-artist-profile-artist-card',
    standalone: true,
    templateUrl: './artist-card.component.html',
    styleUrl: './artist-card.component.scss',
    imports: [MatIcon, NgClass, TranslatePipe],
})
export class ArtistCardComponent {
    @Input() artists: Artist[] | null = [];
    @Input() workingArtist: Artist | null = null;
    isExpanded: boolean = false;
    @Input() showExpandIcon: boolean = true;
    @Input() isSelecting: boolean = false;

    toggleExpanded(): void {
        if (this.artists && this.artists.length > 1) {
            this.isExpanded = !this.isExpanded;
        }
    }
}
