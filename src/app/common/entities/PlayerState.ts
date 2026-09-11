import { Track } from "@features/track/models/track";

export interface PlayerState {
    trackId: string | null;
    queueId: string | null;
    activeDeviceId: string;
    isPlaying: boolean;
    positionMs: number;
    volumePercent: number;
    updatedAt: string;
}

export interface ClientPlayerState {
    track: Track | null;
    isActiveDevice: boolean;
    isPlaying: boolean;
    position: number;
    volumePercent: number;
    updatedAt: string;
}

export interface PositionState {
    positionMs: number;
    updatedAt: string;
}