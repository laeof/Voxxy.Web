import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BaseFilter {
    search: string = '';
    skip: number = 0;
    take: number = 5;

    getParams(): string {
        let url = `?Skip=${this.skip}&Take=${this.take}`;
        url += this.search ? `&Search=${this.search}` : '';
        return url;
    }
}
