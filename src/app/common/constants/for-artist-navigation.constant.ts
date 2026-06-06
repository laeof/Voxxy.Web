import { ForArtistNavigationGroupReleases } from '@common/enums/for-artist-navigation-groups-items.enum';
import { ForArtistNavigationGroups } from '@common/enums/for-artist-navigation-groups.enum';
import { AppNavigation } from '@common/interfaces/navigation.interface';
import { AppRoutes } from './app.routes.constant';

export const forArtistNavigation: AppNavigation = {
    navigationGroups: [
        {
            groupIcon: 'dashboard',
            groupTitle: ForArtistNavigationGroups.DASHBOARD,
            groupItems: [],
            route: AppRoutes.forArtistDashboard,
        },
        {
            groupIcon: 'playlist',
            groupTitle: ForArtistNavigationGroups.RELEASES,
            groupItems: [
                {
                    groupTitle: ForArtistNavigationGroupReleases.ALL_RELEASES,
                    groupIcon: '',
                    groupItems: [],
                    route: AppRoutes.forArtistReleasesAll,
                },
                {
                    groupTitle: ForArtistNavigationGroupReleases.CREATE_RELEASE,
                    groupIcon: '',
                    groupItems: [],
                    route: AppRoutes.forArtistReleasesCreate,
                },
            ],
            route: AppRoutes.forArtistReleases,
        },
        {
            groupIcon: 'analytics',
            groupTitle: ForArtistNavigationGroups.ANALYTICS,
            groupItems: [],
            route: AppRoutes.forArtistAnalytics,
        },
        {
            groupIcon: 'settings',
            groupTitle: ForArtistNavigationGroups.SETTINGS,
            groupItems: [],
            route: AppRoutes.forArtistSettings,
        },
    ],
};
