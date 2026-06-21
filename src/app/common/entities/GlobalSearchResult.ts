import { SearchEntityType } from "@common/enums/search-entity-type.enum";
import { SearchArtist } from "./SearchArtist";
import { BaseEntity } from "./BaseEntity";

export interface GlobalSearchResult extends BaseEntity {
    entityId: string;
    type: SearchEntityType;
    title: string;
    artists?: SearchArtist[];
    releaseTitle?: string;
    imageUrl?: string;
}