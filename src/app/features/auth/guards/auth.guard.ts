import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { UserStateService } from '@common/services/user-state.service';

export const authGuard: CanActivateFn = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
) => {
    const userStateService: UserStateService = inject(UserStateService);
    return userStateService.value() !== null;
};
