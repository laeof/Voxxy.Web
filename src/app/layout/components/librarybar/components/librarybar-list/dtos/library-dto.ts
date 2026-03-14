import { Artist } from '../../../../../../artist/models/artist';
import { BaseEntity } from '../../../../../../common/entities/BaseEntity';
import { Track } from '../../../../../../track/models/track';
import { FollowType } from '../../../enums/follow-type-enum';

export class LibraryDto implements BaseEntity {
    id: string = '';
    name: string = '';
    artist: Artist = {
        name: '',
        id: '',
        imageUrl: '',
    };
    followType: FollowType = null!;
    primaryColor: string = '';
    tracks: Track[] = [];
    imageUrl: string = '';
}
