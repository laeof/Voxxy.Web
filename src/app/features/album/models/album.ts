import { Artist } from '@features/artist/models/artist';
import { Playlist } from '@features/playlist/models/playlist';

export interface Album extends Omit<Playlist, 'createdBy'> {
    createdBy: Artist[];
}
