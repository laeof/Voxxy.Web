import { Injectable } from "@angular/core";
import { BaseFilter } from "@common/filters/base-filter";
import { EntityManagerService } from "@common/services/entity-manager.service";
import { Track } from "../models/track";

@Injectable()
export class TrackService extends EntityManagerService<Track> {
    constructor() {
        super(new BaseFilter());
    }
}