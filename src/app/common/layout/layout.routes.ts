import { Route } from '@angular/router';
import { AppRoutes } from '@common/constants/app.routes.constant';

export const layoutRoutes: Route[] = [
    {
        path: AppRoutes.layout,
        pathMatch: 'full',
        redirectTo: AppRoutes.home,
    },
    {
        path: AppRoutes.home,
        loadComponent: () => import('@features/home/home.component').then((x) => x.HomeComponent),
        data: { page: AppRoutes.home },
    },
    {
        path: AppRoutes.playlist,
        loadComponent: () =>
            import('@features/playlist/playlist.component').then((x) => x.PlaylistComponent),
    },
    {
        path: AppRoutes.album,
        loadComponent: () =>
            import('@features/album/album.component').then((x) => x.AlbumComponent),
    },
    {
        path: AppRoutes.artist,
        loadComponent: () =>
            import('@features/artist/artist.component').then((x) => x.ArtistComponent),
    },
    {
        path: AppRoutes.userProfile,
        loadComponent: () =>
            import('@features/user/components/user-profile/user-profile.component').then(
                (x) => x.UserProfileComponent,
            ),
    },
];
