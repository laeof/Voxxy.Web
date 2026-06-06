import { provideAppInitializer, inject } from "@angular/core";
import { ArtistStateService } from "@common/services/artist-state.service";
import { firstValueFrom, tap, catchError, of } from "rxjs";
import { ForArtistService } from "../services/for-artist.service";
import { ForArtist } from "../interfaces/for-artist.interface";

export const provideArtistInitializer = provideAppInitializer(() => {
    const artistStateService = inject(ArtistStateService);
    const forArtistService = inject(ForArtistService);

    return firstValueFrom(
        forArtistService.getArtistsOnAccount().pipe(
            tap((forArtist: ForArtist) => forArtist.artists && artistStateService.set(forArtist.artists)),
            catchError(() => {
                artistStateService.clear();
                return of(null);
            })
        )
    );
});
