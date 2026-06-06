import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";

@Component({
    selector: 'for-artist-releases',
    standalone: true,
    templateUrl: './releases.component.html',
    styleUrl: './releases.component.scss',
    imports: [RouterOutlet],
})
export class ForArtistReleasesComponent {}