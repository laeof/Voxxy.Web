import { inject } from '@angular/core';
import {
    CanActivateFn,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    Router,
} from '@angular/router';
import { AppRoutes } from '@common/constants/app.routes.constant';
import { ReleaseCreateStateService } from '../services/release-create-state.service';

export const stateGuard: CanActivateFn = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
) => {
    const releaseCreateStateService: ReleaseCreateStateService = inject(ReleaseCreateStateService);
    const router = inject(Router);

    if (
        route.url.some((segment) => segment.path.includes(releaseCreateStateService.stepByProgress))
    ) {
        return true;
    }

    return router.createUrlTree([
        AppRoutes.forArtist,
        AppRoutes.forArtistReleases,
        AppRoutes.forArtistReleasesCreate,
    ]);
};
