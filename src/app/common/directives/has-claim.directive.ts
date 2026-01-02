import { Directive, Input, OnChanges, TemplateRef, ViewContainerRef } from '@angular/core';
import { UserStateService } from '../services/user-state.service';

@Directive({
    selector: '[hasClaim]',
    standalone: true,
})
export class HasClaimDirective implements OnChanges {
    @Input('hasClaim') claims: readonly string[] = [];

    private rendered = false;

    constructor(
        private readonly tpl: TemplateRef<unknown>,
        private readonly vcr: ViewContainerRef,
        private readonly userStateService: UserStateService
    ) {}

    ngOnChanges() {
        const allowed = this.isAllowed();

        if (allowed && !this.rendered) {
            this.vcr.createEmbeddedView(this.tpl);
            this.rendered = true;
        }

        if (!allowed && this.rendered) {
            this.vcr.clear();
            this.rendered = false;
        }
    }

    private isAllowed(): boolean {
        return this.claims.length === 0
            ? this.userStateService.isAnonymous()
            : this.userStateService.hasClaims(this.claims);
    }
}
