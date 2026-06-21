import { Pipe, PipeTransform } from "@angular/core";
import { SearchEntityType } from "@common/enums/search-entity-type.enum";

@Pipe({
    name: 'searchTypeTranslate',
    standalone: true,
})
export class SearchTypeTranslatePipe implements PipeTransform {
    transform(value: SearchEntityType | null | undefined): string {
        if (value == null || value == undefined) return '';

        switch (value) {
            case SearchEntityType.Track:
                return 'SEARCH_TYPE_TRACK';
            case SearchEntityType.Artist:
                return 'SEARCH_TYPE_ARTIST';
            case SearchEntityType.Album:
                return 'SEARCH_TYPE_ALBUM';
            default:
                return '';
        }
    }
}