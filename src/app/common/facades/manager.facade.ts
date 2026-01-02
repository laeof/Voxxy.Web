import { BehaviorSubject, Observable } from 'rxjs';
import { Track } from '../../track/models/track';

export class ManagerFacade {
    isPlaying$: Observable<boolean>;
    playingSong$: BehaviorSubject<Track | null | undefined>;

    constructor() {
        this.isPlaying$ = new Observable<boolean>();
        this.playingSong$ = new BehaviorSubject<Track | null | undefined>(null);
    }
}
