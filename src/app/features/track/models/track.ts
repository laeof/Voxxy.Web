import { BaseEntity } from "@common/entities/BaseEntity";
import { Album } from "@features/album/models/album";
import { Artist } from "@features/artist/models/artist";

export interface Track extends BaseEntity {
    name: string;
    album: Album;
    duration: number;
    imageUrl: string;
    artists: Artist[];
    audioKey: string;
    fromPlaylist?: string;
}
