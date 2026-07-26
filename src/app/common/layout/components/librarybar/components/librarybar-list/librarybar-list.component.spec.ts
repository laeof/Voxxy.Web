import { BehaviorSubject, Subject } from 'rxjs';
import { ConnectStateStore } from '@common/connect/state/connect-state.store';
import { FollowType } from '../../enums/follow-type-enum';
import { LibraryDto } from './dtos/library-dto';
import { LibraryBarListComponent } from './librarybar-list.component';

describe('LibraryBarListComponent playback context', () => {
    it('PlaylistItem_UsesPlaylistEntityIdAndAtomicContextCommand', async () => {
        const store = new ConnectStateStore();
        const sync = { playContext: vi.fn().mockResolvedValue(undefined) };
        const { component } = createComponent(store, sync);
        const item = libraryItem('playlist-entity-id', FollowType.Playlist);
        const event = { stopPropagation: vi.fn() };

        component.togglePlayButton(event as never, item);
        await Promise.resolve();

        expect(event.stopPropagation).toHaveBeenCalledOnce();
        expect(sync.playContext).toHaveBeenCalledWith(
            'playlist-entity-id',
            'Playlist',
            item.tracks,
        );
    });

    it('ViewModels_ShowPauseOnlyForMatchingAuthoritativeContext', () => {
        const store = new ConnectStateStore();
        const { component, entities } = createComponent(store);
        const playlistA = libraryItem('playlist-a', FollowType.Playlist);
        const playlistB = libraryItem('playlist-b', FollowType.Playlist);
        const values: Array<{ id: string; showPause: boolean }> = [];
        component.itemViewModels$.subscribe((items) => {
            values.splice(
                0,
                values.length,
                ...items.map((value) => ({
                    id: value.item.id,
                    showPause: value.showPause,
                })),
            );
        });
        entities.next([playlistA, playlistB]);

        store.applySnapshot(snapshot('playlist-a', 'Playlist', true));
        expect(values).toEqual([
            { id: 'playlist-a', showPause: true },
            { id: 'playlist-b', showPause: false },
        ]);

        store.applyPlayer({
            ...snapshot('playlist-a', 'Playlist', false).player!,
            version: 2,
        });
        expect(values[0].showPause).toBe(false);

        store.applyQueue({
            ...snapshot('playlist-b', 'Playlist', true).queue!,
            version: 2,
        });
        store.applyPlayer({
            ...snapshot('playlist-b', 'Playlist', true).player!,
            version: 3,
        });
        expect(values).toEqual([
            { id: 'playlist-a', showPause: false },
            { id: 'playlist-b', showPause: true },
        ]);
    });

    it('AlbumAndLikedSongs_MapToTheirAuthoritativeSourceTypes', async () => {
        const store = new ConnectStateStore();
        const sync = { playContext: vi.fn().mockResolvedValue(undefined) };
        const { component } = createComponent(store, sync);
        const event = { stopPropagation: vi.fn() };
        const album = libraryItem('album-id', FollowType.Album);
        const liked = libraryItem('liked-id', FollowType.LovedSongs);

        component.togglePlayButton(event as never, album);
        component.togglePlayButton(event as never, liked);
        await Promise.resolve();

        expect(sync.playContext).toHaveBeenNthCalledWith(
            1,
            'album-id',
            'Album',
            album.tracks,
        );
        expect(sync.playContext).toHaveBeenNthCalledWith(
            2,
            'liked-id',
            'LikedSongs',
            liked.tracks,
        );
    });
});

function createComponent(
    store: ConnectStateStore,
    sync: object = { playContext: vi.fn().mockResolvedValue(undefined) },
) {
    const entities = new BehaviorSubject<LibraryDto[]>([]);
    const selected = new BehaviorSubject<string | null>(null);
    const loading = new BehaviorSubject(false);
    const libraryService = {
        onEntitiesChanged$: entities.asObservable(),
        onEntitySelected$: selected.asObservable(),
        onEntitiesLoading$: loading.asObservable(),
        getLibrary: vi.fn(),
        onSelect: vi.fn(),
    };
    const routerEvents = new Subject();
    const followEntities = new Subject();
    const component = new LibraryBarListComponent(
        libraryService as never,
        {} as never,
        { firstChild: null } as never,
        { events: routerEvents.asObservable() } as never,
        sync as never,
        { onEntitiesChanged$: followEntities.asObservable() } as never,
        store,
    );
    return { component, entities };
}

function libraryItem(id: string, followType: FollowType): LibraryDto {
    return {
        id,
        name: id,
        followType,
        tracks: [{ id: 'track-1' } as never],
        artist: {} as never,
        primaryColor: '',
        imageUrl: '',
    };
}

function snapshot(
    sourceId: string,
    sourceType: 'Playlist',
    isPlaying: boolean,
) {
    return {
        status: 'Applied' as const,
        player: {
            isPlaying,
            positionMs: 0,
            positionUpdatedAt: '2026-01-01T00:00:00.000Z',
            volumePercent: 50,
            version: 1,
        },
        queue: {
            items: [],
            currentQueueItemId: null,
            repeatMode: 'None' as const,
            isShuffled: false,
            version: 1,
            sourceId,
            sourceType,
        },
        presence: {
            devices: [],
            activeDeviceId: null,
            audioOwnerConnectionId: null,
            version: 1,
        },
        serverTime: '2026-01-01T00:00:00.000Z',
        errorCode: null,
    };
}
