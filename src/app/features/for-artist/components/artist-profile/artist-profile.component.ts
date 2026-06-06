import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { Artist } from '@features/artist/models/artist';
import { ArtistCardComponent } from './artist-card/artist-card.component';

@Component({
    selector: 'for-artist-profile',
    standalone: true,
    templateUrl: './artist-profile.component.html',
    styleUrl: './artist-profile.component.scss',
    imports: [MatMenu, MatMenuTrigger, ArtistCardComponent],
})
export class ForArtistProfileComponent implements OnInit {
    @Input() artistOnAccount: Artist[] | null = [];
    @Input() workingArtist: Artist | null = null;

    ngOnInit(): void {
        if (this.workingArtist == null && this.artistOnAccount && this.artistOnAccount.length > 0) {
            this.workingArtist = this.artistOnAccount[0];
        }
    }

    selectArtist(artist: Artist): void {
        this.workingArtist = artist;
    }
}
