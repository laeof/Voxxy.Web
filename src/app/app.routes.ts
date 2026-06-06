import { Routes } from '@angular/router';
import { AppRoutes } from './common/constants/app.routes.constant';
import { anonymousGuard } from './features/auth/guards/anonymous.guard';
import { artistGuard } from '@features/auth/guards/artist.guard';
import { forArtistRoutes } from '@features/for-artist/for-artist.routes';
import { layoutRoutes } from '@common/layout/layout.routes';
import { authGuard } from '@features/auth/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: AppRoutes.layout,
        pathMatch: 'prefix',
    },
    {
        path: AppRoutes.layout,
        loadComponent: () =>
            import('./common/layout/layout.component').then((x) => x.LayoutComponent),
        children: layoutRoutes,
    },
    {
        path: AppRoutes.auth,
        loadComponent: () => import('./features/auth/auth.component').then((x) => x.AuthComponent),
        canActivate: [anonymousGuard],
    },
    {
        path: AppRoutes.forArtist,
        loadComponent: () =>
            import('./features/for-artist/for-artist.component').then((x) => x.ForArtistComponent),
        children: [
            { path: '', redirectTo: AppRoutes.forArtistDashboard, pathMatch: 'full' },
            ...forArtistRoutes,
        ],
        canActivate: [authGuard, artistGuard],
    },
    { path: '**', redirectTo: AppRoutes.layout },
];
