import { ListEntitiesFacade } from '../common/facades/list-entities.facade';
import { Artist } from './models/artist';
import { ArtistService } from './services/artist.service';

export class ArtistComponent extends ListEntitiesFacade<Artist> {
    constructor(private readonly artistService: ArtistService) {
        super(artistService);
    }
}
