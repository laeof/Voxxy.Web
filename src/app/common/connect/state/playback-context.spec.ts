import {
    currentQueueItem,
    displayedIndexForQueueItem,
    isContextPlaying,
    isSamePlaybackContext,
    queueItemForDisplayedTrack,
} from './playback-context';

describe('playback context helpers', () => {
    it('ContextComparison_UsesBothSourceIdAndSourceType', () => {
        const queue = queueState();

        expect(
            isSamePlaybackContext(queue, {
                sourceId: 'source-1',
                sourceType: 'Album',
            }),
        ).toBe(true);
        expect(
            isContextPlaying(player(true), queue, {
                sourceId: 'source-1',
                sourceType: 'Playlist',
            }),
        ).toBe(false);
    });

    it('QueueItemMapping_UsesTrackIdentityInsteadOfCrossCollectionIndex', () => {
        const queue = queueState();
        const displayedTracks = [{ id: 'track-2' }, { id: 'track-1' }];

        expect(
            queueItemForDisplayedTrack(queue, displayedTracks, 0)?.queueItemId,
        ).toBe('queue-2');
        expect(
            displayedIndexForQueueItem(
                queue,
                displayedTracks,
                currentQueueItem(queue)!,
            ),
        ).toBe(1);
    });

    it('QueueItemMapping_DistinguishesDuplicateTrackOccurrences', () => {
        const queue = {
            ...queueState(),
            items: [
                { queueItemId: 'queue-a', trackId: 'duplicate', canonicalOrder: 0 },
                { queueItemId: 'queue-b', trackId: 'duplicate', canonicalOrder: 1 },
            ],
            currentQueueItemId: 'queue-b',
        };
        const displayedTracks = [{ id: 'duplicate' }, { id: 'duplicate' }];

        expect(
            queueItemForDisplayedTrack(queue, displayedTracks, 1)?.queueItemId,
        ).toBe('queue-b');
        expect(
            displayedIndexForQueueItem(
                queue,
                displayedTracks,
                currentQueueItem(queue)!,
            ),
        ).toBe(1);
    });
});

function queueState() {
    return {
        items: [
            { queueItemId: 'queue-1', trackId: 'track-1', canonicalOrder: 0 },
            { queueItemId: 'queue-2', trackId: 'track-2', canonicalOrder: 1 },
        ],
        currentQueueItemId: 'queue-1',
        repeatMode: 'None' as const,
        isShuffled: false,
        version: 1,
        sourceId: 'source-1',
        sourceType: 'Album' as const,
    };
}

function player(isPlaying: boolean) {
    return {
        isPlaying,
        positionMs: 0,
        positionUpdatedAt: '2026-01-01T00:00:00Z',
        volumePercent: 50,
        version: 1,
    };
}
