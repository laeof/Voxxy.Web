import { BaseEntity } from "@common/entities/BaseEntity";
import { FollowType } from "@common/layout/components/librarybar/enums/follow-type-enum";

export interface Following extends BaseEntity {
    followerId: string;
    followeeId: string;
    type: FollowType;
}