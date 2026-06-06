import { AudioFileItem } from '@common/components/file-drag-drop/file-drag-drop.component';
import { ImageFileItem } from '@common/components/subject-image-upload/subject-image-upload.component';

export interface ReleaseCreateForm {
    title: string;
    description: string;
    coverImage: ImageFileItem | null;
    releaseDate: Date | null;
    additionalInformation: string;
    artists: string[];
    album: string;
    tracks: ReleaseCreateTrack[];
}

export interface ReleaseCreateTrack {
    title: string;
    position: number;
    duration: number;
    language: string;
    isRemix: boolean;
    audioFile: AudioFileItem | null;
}
