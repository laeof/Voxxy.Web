import { provideAppInitializer, inject } from '@angular/core';
import { DeviceService } from '@common/layout/components/playerbar/components/device/services/device-service';
import { ArtistStateService } from '@common/services/artist-state.service';
import { PlayerHubService } from '@common/services/player-hub.service';
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
    const playerHubService = inject(PlayerHubService);
    const deviceService = inject(DeviceService);

    return firstValueFrom(
        authService.me().pipe(
            tap((me) => me),
            switchMap((me) => {
                if (!me) {
                    return of(null);
                }

                userStateService.set(me);
                deviceService.tryCreateDeviceId();
                playerHubService.connect();

                return authService.xsrfToken().pipe(
                    switchMap(() => {
                        return forArtistService.getArtistsOnAccount().pipe(
                            tap(
                                (forArtist: ForArtist) =>
                                    forArtist.artists && artistStateService.set(forArtist.artists),
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
