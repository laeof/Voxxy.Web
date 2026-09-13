import { BehaviorSubject, Subject } from 'rxjs';
import { MediaPlayerStateService } from '@common/services/media-player-state.service';
import { FollowType } from '../../enums/follow-type-enum';
import { LibraryDto } from './dtos/library-dto';
import { LibraryBarListComponent } from './librarybar-list.component';

describe('LibraryBarListComponent playback context', () => {
    it('PlaylistItem_UsesPlaylistEntityIdAndAtomicContextCommand', async () => {
        const store = new MediaPlayerStateService();
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
        const store = new MediaPlayerStateService();
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

        applyState(store, 'playlist-a', 'Playlist', true);
        expect(values).toEqual([
            { id: 'playlist-a', showPause: true },
            { id: 'playlist-b', showPause: false },
        ]);

        store.pause();
        expect(values[0].showPause).toBe(false);

        applyState(store, 'playlist-b', 'Playlist', true);
        expect(values).toEqual([
            { id: 'playlist-a', showPause: false },
            { id: 'playlist-b', showPause: true },
        ]);
    });

    it('AlbumAndLikedSongs_MapToTheirAuthoritativeSourceTypes', async () => {
        const store = new MediaPlayerStateService();
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
    store: MediaPlayerStateService,
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

function applyState(
    state: MediaPlayerStateService,
    sourceId: string,
    sourceType: 'Playlist',
    isPlaying: boolean,
): void {
    state.applyAuthoritativeState({
        isPlaying, volumePercent: 50, queue: [], index: -1, currentTrack: null,
        repeat: state.repeat, isAudioOwner: false, sourceId, sourceType,
    });
}
