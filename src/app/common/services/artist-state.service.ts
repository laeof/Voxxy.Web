import { Injectable } from "@angular/core";
import { Artist } from "@features/artist/models/artist";
import { BehaviorSubject } from "rxjs";

@Injectable({
    providedIn: 'root',
})
export class ArtistStateService {
    private readonly artists$ = new BehaviorSubject<Artist[]>([]);

    changes$ = this.artists$.asObservable();

    set(artists: Artist[]) {
        this.artists$.next(artists);
    }

    clear() {
        this.artists$.next([]);
    }

    value(): Artist[] {
        return this.artists$.value;
    }
}