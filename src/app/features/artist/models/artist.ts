import { BaseEntity } from '@common/entities/BaseEntity';
import { Album } from '@features/album/models/album';

export interface Artist extends BaseEntity {
    name: string;
    imageUrl: string;
    albums: Album[];
}
