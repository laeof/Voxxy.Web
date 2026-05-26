import { Injectable } from '@angular/core';
import { UserClaim } from '@features/auth/models/user-claim';
import { BehaviorSubject } from 'rxjs';
import { User } from '@features/auth/models/user';

@Injectable({
    providedIn: 'root',
})
export class UserStateService {
    private readonly me$ = new BehaviorSubject<User | null>(null);

    isAnonymous(): boolean {
        return this.me$.value === null;
    }

    hasClaims(claims: readonly string[]): boolean {
        return claims.every((c) => this.me$.value?.userClaims.some((x) => x.value === c));
    }

    changes$ = this.me$.asObservable();

    set(me: User) {
        this.me$.next(me);
    }

    clear() {
        this.me$.next(null);
    }

    value(): User | null {
        return this.me$.value;
    }

    hasPermission(permission: UserClaim): boolean {
        return this.me$.value?.userClaims.includes(permission) ?? false;
    }
}
