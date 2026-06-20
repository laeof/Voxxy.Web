import { AudioFileItem } from '@common/components/file-drag-drop/file-drag-drop.component';
import { ImageFileItem } from '@common/components/subject-image-upload/subject-image-upload.component';

export interface ReleaseCreateForm {
    title: string;
    releaseDate: string;
    additionalInformation: string;
    artistIds: string[];
    moodIds: string[];
    genreIds: string[];
    tracks: ReleaseCreateTrack[];
    coverImage: File;
    copyright: string;
    releaseType: string;
}

export interface ReleaseCreateTrack {
    title: string;
    position: number;
    duration: number;
    language: string;
    isRemix: boolean;
    audioFile: AudioFileItem | null;
}

export interface ReleaseCreateMainInformation {
    title: string;
    coverImage: ImageFileItem;
    releaseDate: string;
    additionalInformation: string;
    artistIds: string[];
    moodIds: string[];
    genreIds: string[];
    copyright: string;
    releaseType: string;
}
