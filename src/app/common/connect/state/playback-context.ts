import {
    PlaybackSourceTypeContract,
    PlayerStateDto,
    QueueItemDto,
    QueueStateDto,
} from '../transport/connect-transport.models';

export interface PlaybackContext {
    sourceId: string;
    sourceType: PlaybackSourceTypeContract;
}

export function isSamePlaybackContext(
    queue: QueueStateDto | null,
    context: PlaybackContext,
): boolean {
    return queue?.sourceId === context.sourceId && queue.sourceType === context.sourceType;
}

export function isContextPlaying(
    player: PlayerStateDto | null,
    queue: QueueStateDto | null,
    context: PlaybackContext,
): boolean {
    return isSamePlaybackContext(queue, context) && player?.isPlaying === true;
}

export function currentQueueItem(queue: QueueStateDto | null): QueueItemDto | null {
    if (!queue?.currentQueueItemId) return null;
    return (
        queue.items.find((item) => item.queueItemId === queue.currentQueueItemId) ?? null
    );
}

export function queueItemForDisplayedTrack(
    queue: QueueStateDto,
    displayedTracks: readonly { id: string }[],
    displayedIndex: number,
): QueueItemDto | null {
    const track = displayedTracks[displayedIndex];
    if (!track) return null;

    const occurrence = displayedTracks
        .slice(0, displayedIndex)
        .filter((item) => item.id === track.id).length;
    return (
        queue.items
            .filter((item) => item.trackId === track.id)
            .sort((left, right) => left.canonicalOrder - right.canonicalOrder)[occurrence] ??
        null
    );
}

export function displayedIndexForQueueItem(
    queue: QueueStateDto,
    displayedTracks: readonly { id: string }[],
    queueItem: QueueItemDto,
): number {
    const occurrence = queue.items
        .filter((item) => item.trackId === queueItem.trackId)
        .sort((left, right) => left.canonicalOrder - right.canonicalOrder)
        .findIndex((item) => item.queueItemId === queueItem.queueItemId);
    if (occurrence < 0) return -1;

    let currentOccurrence = 0;
    for (let index = 0; index < displayedTracks.length; index++) {
        if (displayedTracks[index].id !== queueItem.trackId) continue;
        if (currentOccurrence === occurrence) return index;
        currentOccurrence++;
    }
    return -1;
}
