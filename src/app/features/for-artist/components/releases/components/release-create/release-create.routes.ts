import { Route } from '@angular/router';
import { AppRoutes } from '@common/constants/app.routes.constant';

export const forArtistReleaseCreateRoutes: Route[] = [
    {
        path: AppRoutes.forArtistReleasesCreate,
        loadComponent: () =>
            import('./release-create.component').then((x) => {
                return x.ForArtistReleaseCreateComponent;
            }),
        children: [
            { path: '', redirectTo: AppRoutes.forArtistReleasesCreateAddReleaseInformation, pathMatch: 'full' },
            {
                path: AppRoutes.forArtistReleasesCreateAddReleaseInformation,
                loadComponent: () =>
                    import('./components/add-information/add-information.component').then(
                        (x) => x.AddInformationComponent,
                    ),
            },
            {
                path: AppRoutes.forArtistReleasesCreateUploadTracks,
                loadComponent: () =>
                    import('./components/upload-tracks/upload-tracks.component').then(
                        (x) => x.UploadTracksComponent,
                    ),
            },
            {
                path: AppRoutes.forArtistReleasesCreatePublish,
                loadComponent: () =>
                    import('./components/publish/publish.component').then(
                        (x) => x.PublishComponent,
                    ),
            },
        ],
    },
];
