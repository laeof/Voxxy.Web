import { Artist } from '../../artist/models/artist';
import { Playlist } from '../../playlist/models/playlist';

export interface Album extends Omit<Playlist, 'createdBy'> {
    createdBy: Artist;
}
