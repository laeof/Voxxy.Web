import { Component, Input, OnInit } from '@angular/core';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { Artist } from '@features/artist/models/artist';
import { ArtistCardComponent } from './artist-card/artist-card.component';
import { ForArtistService } from '@features/for-artist/services/for-artist.service';

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

    constructor(private readonly forArtistService: ForArtistService) {}

    ngOnInit(): void {
        if (this.workingArtist == null && this.artistOnAccount && this.artistOnAccount.length > 0) {
            this.workingArtist = this.artistOnAccount[0];
            this.forArtistService.setWorkingArtistId(this.workingArtist.id);
        }
    }

    selectArtist(artist: Artist): void {
        this.workingArtist = artist;
        this.forArtistService.setWorkingArtistId(artist.id);
    }
}
