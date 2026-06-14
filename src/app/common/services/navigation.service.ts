import { Injectable } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { AppRoutes } from '../constants/app.routes.constant';
import { UrlHelper } from '../helpers/url.helper';
import { LibraryDto } from '@common/layout/components/librarybar/components/librarybar-list/dtos/library-dto';
import { FollowType } from '@common/layout/components/librarybar/enums/follow-type-enum';
import { AppNavigationGroup } from '@common/interfaces/navigation.interface';
import { forArtistNavigation } from '@common/constants/for-artist-navigation.constant';
import { filter } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class NavigationService {
    constructor(
        private readonly router: Router,
    ) {}

    get currentUrl(): string {
        return this.router.url;
    }

    navigateFromLibrary(libraryDto: LibraryDto): void {
        switch (libraryDto.followType) {
            case FollowType.Playlist:
                this.navigatePlaylistById(libraryDto.id);
                break;
            case FollowType.Album:
                this.navigateAlbumById(libraryDto.id);
                break;
            case FollowType.Single:
                this.navigateAlbumById(libraryDto.id);
                break;
            case FollowType.Artist:
                this.navigateArtistById(libraryDto.id);
                break;
            case FollowType.LovedSongs:
                this.navigatePlaylistById(libraryDto.id);
                break;
            case FollowType.User:
                this.navigateUserProfileById(libraryDto.id);
                break;
            default:
                console.warn(`NavigationService: Unknown library type '${libraryDto.followType}'`);
        }
    }

    navigatePlaylistById(id: string): void {
        this.router.navigate([UrlHelper.transform(AppRoutes.playlist, ':id', id)]);
    }

    navigateArtistById(id: string): void {
        this.router.navigate([UrlHelper.transform(AppRoutes.artist, ':id', id)]);
    }

    navigateAlbumById(id: string): void {
        this.router.navigate([UrlHelper.transform(AppRoutes.album, ':id', id)]);
    }

    navigateUserProfileById(id: string): void {
        this.router.navigate([UrlHelper.transform(AppRoutes.userProfile, ':id', id)]);
    }

    navigateHome(): void {
        this.router.navigate([AppRoutes.home]);
    }

    navigateLogin(): void {
        this.router.navigate([AppRoutes.auth]);
    }

    navigateRegister(): void {
        this.router.navigate([AppRoutes.auth]);
    }

    navigateForArtist(groupTitle: string): void {
        if (groupTitle === AppRoutes.forArtist) {
            this.router.navigate([AppRoutes.forArtist]);
            return;
        }

        const navigation = this.findNavigationPath(
            forArtistNavigation.navigationGroups,
            groupTitle,
            [AppRoutes.forArtist],
        );

        if (!navigation) {
            return;
        }

        this.router.navigate(navigation);
    }

    private findNavigationPath(
        groups: AppNavigationGroup[],
        groupTitle: string,
        parentPath: string[],
    ): string[] | null {
        for (const group of groups) {
            const currentPath = group.route ? [...parentPath, group.route] : parentPath;

            if (group.groupTitle === groupTitle) {
                return currentPath;
            }

            const childPath = this.findNavigationPath(group.groupItems, groupTitle, currentPath);

            if (childPath) {
                return childPath;
            }
        }

        return null;
    }

    navigateNextPath(path: string, relativeTo?: ActivatedRoute): void {
        this.router.navigate([path], {
            relativeTo: relativeTo || null,
        });
    }

    navigationEndSubscribe(callback: () => void): void {
        this.router.events
            .pipe(filter((event) => event instanceof NavigationEnd))
            .subscribe(() => callback());
    }
}
