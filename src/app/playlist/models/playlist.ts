import { Artist } from '../../artist/models/artist';
import { User } from '../../auth/models/user';
import { BaseEntity } from '../../common/entities/BaseEntity';
import { Track } from '../../track/models/track';
import { PlaylistType } from '../../common/enums/playlist-type';

export interface Playlist extends BaseEntity {
    name: string;
    artist: Artist;
    playlistType: PlaylistType;
    primaryColor: string;
    tracks: Track[];
    imageUrl: string;
    createdBy: User;
}
