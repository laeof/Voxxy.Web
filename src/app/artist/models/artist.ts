import { BaseEntity } from '../../common/entities/BaseEntity';

export interface Artist extends BaseEntity {
    name: string;
    imageUrl: string;
}
