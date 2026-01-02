import { Directive, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { UserStateService } from '../services/user-state.service';

@Directive({
    selector: '[anonymous]',
    standalone: true,
})
export class AnonymousDirective implements OnInit {
    private rendered = false;

    constructor(
        private readonly tpl: TemplateRef<unknown>,
        private readonly vcr: ViewContainerRef,
        private readonly userStateService: UserStateService
    ) {}

    ngOnInit() {
        this.userStateService.changes$.subscribe(() => this.updateView());
        this.updateView();
    }

    private updateView() {
        const allowed = this.userStateService.value() === null;

        if (allowed && !this.rendered) {
            this.vcr.createEmbeddedView(this.tpl);
            this.rendered = true;
        }

        if (!allowed && this.rendered) {
            this.vcr.clear();
            this.rendered = false;
        }
    }
}
