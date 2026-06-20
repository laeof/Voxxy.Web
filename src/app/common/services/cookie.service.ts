import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class CookieService {
    getCookie(name: string): string | null | undefined {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();

        return null;
    }
    setCookie(name: string, value: string, days: number): void {
        let expires = '';
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + (value || '') + expires + '; path=/';
    }

    deleteCookie(name: string): void {
        document.cookie = name + '=; Max-Age=-99999999;';
    }
}
