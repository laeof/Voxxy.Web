import { Artist } from '@features/artist/models/artist';
import { User } from '@features/auth/models/user';
import { BaseEntity } from '@common/entities/BaseEntity';
import { Track } from '@features/track/models/track';
import { PlaylistType } from '@common/enums/playlist-type';

export interface Playlist extends BaseEntity {
    name: string;
    artists: Artist[];
    playlistType: PlaylistType;
    primaryColor: string;
    tracks: Track[];
    imageUrl: string;
    createdBy: User;
}
