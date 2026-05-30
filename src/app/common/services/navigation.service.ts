import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AppRoutes } from '../constants/app.routes.constant';
import { UrlHelper } from '../helpers/url.helper';
import { LibraryDto } from '@common/layout/components/librarybar/components/librarybar-list/dtos/library-dto';
import { FollowType } from '@common/layout/components/librarybar/enums/follow-type-enum';

@Injectable({
    providedIn: 'root',
})
export class NavigationService {
    constructor(private readonly router: Router) {}

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
}
