export interface PlayRequest {
    trackId: string | null;
    queueId: string | null;
    positionMs: number;
    updatedAt: string;
}