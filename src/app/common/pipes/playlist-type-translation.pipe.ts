import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'playlistTypeTranslate',
    standalone: true,
})
export class PlaylistTypeTranslatePipe implements PipeTransform {
    transform(value: number | null | undefined): string {
        if (value == null || value == undefined) return '';

        switch (value) {
            case 1:
                return 'PLAYLIST_TYPE_PLAYLIST';
            case 2:
                return 'PLAYLIST_TYPE_ALBUM';
            case 3:
                return 'PLAYLIST_TYPE_SINGLE';
            case 4:
                return 'PLAYLIST_TYPE_ARTIST';
            case 5:
                return 'PLAYLIST_TYPE_PLAYLIST';
            case 6:
                return 'PLAYLIST_TYPE_USER';
            default:
                return '';
        }
    }
}
