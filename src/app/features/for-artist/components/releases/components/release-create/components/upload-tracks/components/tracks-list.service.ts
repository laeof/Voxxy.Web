import { Injectable } from '@angular/core';
import { AudioFileItem } from '@common/components/file-drag-drop/file-drag-drop.component';
import { BaseEntity } from '@common/entities/BaseEntity';
import { BaseFilter } from '@common/filters/base-filter';
import { EntityManagerService } from '@common/services/entity-manager.service';

export interface LocalTrackEntity extends BaseEntity {
    title: string;
    position: number;
    duration: number;
    durationText: string;
    audioUrl: string;
    audioFile: AudioFileItem;
    isRemix: boolean;
    language: string;
}

@Injectable()
export class UploadTracksManagerService extends EntityManagerService<LocalTrackEntity> {
    constructor() {
        super(new BaseFilter());
    }

    setTracks(tracks: LocalTrackEntity[]): void {
        this.onEntitiesChanged.next(tracks);
    }

    get snapshot(): LocalTrackEntity[] {
        return this.onEntitiesChanged.value;
    }

    removeById(id: string): void {
        this.setTracks(this.snapshot.filter((track) => track.id !== id));
    }

    reorder(previousIndex: number, currentIndex: number): void {
        const tracks = [...this.snapshot];

        const [movedTrack] = tracks.splice(previousIndex, 1);
        tracks.splice(currentIndex, 0, movedTrack);

        const updatedTracks = tracks.map((track, index) => ({
            ...track,
            position: index + 1,
        }));

        this.setTracks(updatedTracks);
    }
}
