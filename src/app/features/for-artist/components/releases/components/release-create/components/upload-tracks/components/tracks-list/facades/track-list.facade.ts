import { EventEmitter, Injectable, Output } from "@angular/core";
import { AudioFileItem } from "@common/components/file-drag-drop/file-drag-drop.component";
import { ListEntitiesFacade } from "@common/facades/list-entities.facade";
import { LocalMediaPlayerService, LocalTrack } from "@common/services/local-media-player.service";
import { LocalTrackEntity, UploadTracksManagerService } from "../../tracks-list.service";

@Injectable()
export class UploadTracksListFacade extends ListEntitiesFacade<LocalTrackEntity> {
    @Output() trackRemoved = new EventEmitter<LocalTrackEntity>();
    @Output() trackTitleUpdated = new EventEmitter<{ trackId: string; title: string }>();
    @Output() trackIsRemixUpdated = new EventEmitter<{ trackId: string; isRemix: boolean }>();
    @Output() tracksReordered = new EventEmitter<LocalTrackEntity[]>();
    @Output() tracksUpdated = new EventEmitter<LocalTrackEntity[]>();

    constructor(
        private readonly uploadTracksManagerService: UploadTracksManagerService,
        private readonly localMediaPlayerService: LocalMediaPlayerService,
    ) {
        super(uploadTracksManagerService);
    }

    setAudioFiles(files: AudioFileItem[]): void {
        const tracks = files.map((file, index) => this.mapAudioFileToTrack(file, index, false));
        this.uploadTracksManagerService.setTracks(tracks);
        this.tracksUpdated.emit(tracks);
    }

    removeTrack(track: LocalTrackEntity): void {
        if (track.audioUrl) {
            URL.revokeObjectURL(track.audioUrl);
        }

        this.uploadTracksManagerService.removeById(track.id);
        this.recalculatePositions();
        this.trackRemoved.emit(track);
    }

    reorderTracks(previousIndex: number, currentIndex: number): void {
        this.uploadTracksManagerService.reorder(previousIndex, currentIndex);
        this.tracksReordered.emit(this.uploadTracksManagerService.snapshot);
    }

    playTrack(index: number): void {
        const tracks = this.uploadTracksManagerService.snapshot.map(
            (track): LocalTrack => ({
                id: track.id,
                name: track.title,
                duration: track.duration,
                audioUrl: track.audioUrl,
            }),
        );

        this.localMediaPlayerService.playQueue(tracks, index);
    }

    stopTrack(): void {
        this.localMediaPlayerService.stop();
    }

    updateTitle(trackId: string, title: string): void {
        const updatedTracks = this.uploadTracksManagerService.snapshot.map(track =>
            track.id === trackId
                ? {
                      ...track,
                      title,
                  }
                : track,
        );

        this.uploadTracksManagerService.setTracks(updatedTracks);
        this.trackTitleUpdated.emit({ trackId, title });
    }

    updateIsRemix(trackId: string, isRemix: boolean): void {
        const updatedTracks = this.uploadTracksManagerService.snapshot.map(track =>
            track.id === trackId
                ? {
                      ...track,
                      isRemix,
                  }
                : track,
        );

        this.uploadTracksManagerService.setTracks(updatedTracks);
        this.trackIsRemixUpdated.emit({ trackId, isRemix });
    }

    private recalculatePositions(): void {
        const updatedTracks = this.uploadTracksManagerService.snapshot.map((track, index) => ({
            ...track,
            position: index + 1,
        }));

        this.uploadTracksManagerService.setTracks(updatedTracks);
    }

    private mapAudioFileToTrack(file: AudioFileItem, index: number, isRemix: boolean): LocalTrackEntity {
        return {
            id: file.id,
            title: file.name,
            position: index + 1,
            duration: file.duration ?? 0,
            durationText: file.durationText ?? '0:00',
            audioUrl: file.objectUrl,
            audioFile: file,
            isRemix: isRemix,
            language: '',
        };
    }
}