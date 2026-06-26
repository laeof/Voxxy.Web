export interface PlayerState {
    isPlaying: boolean;
    currentTrackId: string | null;
    positionMs: number;
    volumePercent: number;
}