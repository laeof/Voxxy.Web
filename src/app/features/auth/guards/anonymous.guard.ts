import { inject } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    CanActivateFn,
    Router,
    RouterStateSnapshot,
} from '@angular/router';
import { UserStateService } from '@common/services/user-state.service';

export const anonymousGuard: CanActivateFn = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
) => {
    const userStateService: UserStateService = inject(UserStateService);
    const router: Router = inject(Router);

    if (userStateService.value() !== null) {
        return router.createUrlTree(['/']);
    }

    return userStateService.value() === null;
};
