import { inject } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    CanActivateFn,
    RouterStateSnapshot,
} from '@angular/router';
import { ArtistStateService } from '@common/services/artist-state.service';

export const artistGuard: CanActivateFn = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
) => {
    const artistStateService: ArtistStateService = inject(ArtistStateService);
    return artistStateService.value().length > 0;
};
