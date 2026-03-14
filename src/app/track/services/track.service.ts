import { Injectable } from "@angular/core";
import { Track } from "../models/track";
import { BaseFilter } from "../../common/filters/base-filter";
import { EntityManagerService } from "../../common/services/entity-manager.service";

@Injectable()
export class TrackService extends EntityManagerService<Track> {
    constructor() {
        super(new BaseFilter());
    }
}