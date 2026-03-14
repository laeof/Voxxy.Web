import { Album } from '../../album/models/album';
import { Artist } from '../../artist/models/artist';
import { BaseEntity } from '../../common/entities/BaseEntity';

export interface Track extends BaseEntity {
    name: string;
    album: Album;
    duration: number;
    imageUrl: string;
    artist: Artist;
    audioKey: string;
    fromPlaylist?: string;
}
