import { Routes } from '@angular/router';
import { AppRoutes } from './common/constants/app.routes.constant';
import { anonymousGuard } from './auth/guards/anonymous.guard';

export const routes: Routes = [
    {
        path: AppRoutes.layout,
        loadComponent: () => import('./layout/layout.component').then((x) => x.LayoutComponent),
        children: [
            {
                path: AppRoutes.layout,
                pathMatch: 'full',
                redirectTo: AppRoutes.home,
            },
            {
                path: AppRoutes.home,
                loadComponent: () => import('./home/home.component').then((x) => x.HomeComponent),
                data: { page: AppRoutes.home },
            },
            {
                path: AppRoutes.playlist,
                loadComponent: () =>
                    import('./playlist/playlist.component').then((x) => x.PlaylistComponent),
            },
            {
                path: AppRoutes.album,
                loadComponent: () =>
                    import('./playlist/playlist.component').then((x) => x.PlaylistComponent),
            },
            {
                path: AppRoutes.artist,
                loadComponent: () =>
                    import('./playlist/playlist.component').then((x) => x.PlaylistComponent),
            },
        ],
    },
    {
        path: AppRoutes.auth,
        loadComponent: () => import('./auth/auth.component').then((x) => x.AuthComponent),
        canActivate: [anonymousGuard],
    },
];
