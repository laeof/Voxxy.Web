import { Route } from '@angular/router';
import { AppRoutes } from '@common/constants/app.routes.constant';
import { forArtistReleaseCreateRoutes } from './components/releases/components/release-create/release-create.routes';

export const forArtistRoutes: Route[] = [
    {
        path: AppRoutes.forArtistDashboard,
        loadComponent: () =>
            import('./components/dashboard/dashboard.component').then(
                (x) => x.ForArtistDashboardComponent,
            ),
    },
    {
        path: AppRoutes.forArtistReleases,
        loadComponent: () =>
            import('./components/releases/releases.component').then(
                (x) => x.ForArtistReleasesComponent,
            ),
        children: [
            {
                path: AppRoutes.forArtistReleasesAll,
                loadComponent: () =>
                    import('./components/releases/components/releases-all/releases-all.component').then(
                        (x) => x.ForArtistReleasesAllComponent,
                    ),
            },
            ...forArtistReleaseCreateRoutes,
        ],
    },
    {
        path: '**',
        redirectTo: AppRoutes.forArtistDashboard,
    }
];
