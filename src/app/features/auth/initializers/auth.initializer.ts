import { inject, provideAppInitializer } from '@angular/core';
import { firstValueFrom, of } from 'rxjs';
import { tap, catchError, first } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { UserStateService } from '@common/services/user-state.service';

export const provideAuthInitializer = provideAppInitializer(() => {
    const authService = inject(AuthService);
    const userStateService = inject(UserStateService);

    return firstValueFrom(
        authService.me().pipe(
            tap((me) => me && userStateService.set(me)),
            catchError(() => {
                userStateService.clear();
                authService.logout().pipe(first()).subscribe();
                return of(null);
            })
        )
    );
});
