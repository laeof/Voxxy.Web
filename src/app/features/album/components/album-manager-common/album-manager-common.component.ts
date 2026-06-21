import { Component, Input } from '@angular/core';
import { NavigationService } from '@common/services/navigation.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'album-manager-common',
    templateUrl: './album-manager-common.component.html',
    styleUrl: './album-manager-common.component.scss',
    imports: [TranslatePipe],
})
export class AlbumManagerCommonComponent {
    @Input() tracksAmount: number | undefined = undefined;
    @Input() artists: { name: string; id: string; imageUrl?: string }[] | undefined = [];

    constructor(private readonly navigationService: NavigationService) {}

    redirectToArtist(artistId: string | undefined): void {
        if (!artistId || artistId.trim() === '') return;

        this.navigationService.navigateArtistById(artistId);
    }
}
