import { Routes } from '@angular/router';
import { AppRoutes } from './common/constants/app.routes.constant';
import { anonymousGuard } from './features/auth/guards/anonymous.guard';

export const routes: Routes = [
    {
        path: AppRoutes.layout,
        loadComponent: () => import('./common/layout/layout.component').then((x) => x.LayoutComponent),
        children: [
            {
                path: AppRoutes.layout,
                pathMatch: 'full',
                redirectTo: AppRoutes.home,
            },
            {
                path: AppRoutes.home,
                loadComponent: () => import('./features/home/home.component').then((x) => x.HomeComponent),
                data: { page: AppRoutes.home },
            },
            {
                path: AppRoutes.playlist,
                loadComponent: () =>
                    import('./features/playlist/playlist.component').then((x) => x.PlaylistComponent),
            },
            {
                path: AppRoutes.album,
                loadComponent: () =>
                    import('./features/album/album.component').then((x) => x.AlbumComponent),
            },
            {
                path: AppRoutes.artist,
                loadComponent: () =>
                    import('./features/artist/artist.component').then((x) => x.ArtistComponent),
            },
        ],
    },
    {
        path: AppRoutes.auth,
        loadComponent: () => import('./features/auth/auth.component').then((x) => x.AuthComponent),
        canActivate: [anonymousGuard],
    },
];
