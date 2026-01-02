import { ListEntitiesFacade } from '../common/facades/list-entities.facade';
import { Album } from './models/album';
import { AlbumService } from './services/album.service';

export class AlbumComponent extends ListEntitiesFacade<Album> {
    constructor(private readonly albumService: AlbumService) {
        super(albumService);
    }
}
