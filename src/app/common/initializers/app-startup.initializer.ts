import { provideAppInitializer, inject } from '@angular/core';
import { ArtistStateService } from '@common/services/artist-state.service';
import { PlayerHubService } from '@common/services/player-hub.service';
import { MediaPlayerSyncService } from '@common/services/media-player-sync.service';
import { UserStateService } from '@common/services/user-state.service';
import { AuthService } from '@features/auth/services/auth.service';
import { ForArtist } from '@features/for-artist/interfaces/for-artist.interface';
import { ForArtistService } from '@features/for-artist/services/for-artist.service';
import { catchError, first, firstValueFrom, of, switchMap, tap } from 'rxjs';

export const provideAppStartupInitializer = provideAppInitializer(() => {
    const authService = inject(AuthService);
    const forArtistService = inject(ForArtistService);
    const userStateService = inject(UserStateService);
    const artistStateService = inject(ArtistStateService);
    // Reconciliation is application infrastructure, not a player UI side effect. Instantiate the
    // root service before SignalR can deliver a snapshot or realtime event.
    inject(MediaPlayerSyncService);
    const playerHubService = inject(PlayerHubService);

    return firstValueFrom(
        authService.me().pipe(
            tap((me) => me),
            switchMap((me) => {
                if (!me) {
                    return of(null);
                }

                userStateService.set(me);
                // Connect is optional and must never hold Angular bootstrap behind a Redis
                // timeout. It owns its recovery loop while the normal API initializes normally.
                void playerHubService.connect().catch(() => undefined);
                return authService.xsrfToken().pipe(
                    switchMap(() => {
                        return forArtistService.getArtistsOnAccount().pipe(
                            tap(
                                (forArtist: ForArtist) =>
                                    forArtist.artists &&
                                    artistStateService.set(forArtist.artists),
                            ),
                            catchError(() => {
                                artistStateService.clear();
                                return of(null);
                            }),
                        );
                    }),
                );
            }),
            catchError(() => {
                userStateService.clear();
                authService.logout().pipe(first()).subscribe();
                return of(null);
            }),
        ),
    );
});
