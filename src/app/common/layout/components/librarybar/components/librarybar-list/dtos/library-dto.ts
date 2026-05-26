import { BaseEntity } from "@common/entities/BaseEntity";
import { Artist } from "@features/artist/models/artist";
import { Track } from "@features/track/models/track";
import { FollowType } from "../../../enums/follow-type-enum";


export class LibraryDto implements BaseEntity {
    id: string = '';
    name: string = '';
    artist: Artist = {
        name: '',
        id: '',
        imageUrl: '',
        albums: [],
    };
    followType: FollowType = null!;
    primaryColor: string = '';
    tracks: Track[] = [];
    imageUrl: string = '';
}
