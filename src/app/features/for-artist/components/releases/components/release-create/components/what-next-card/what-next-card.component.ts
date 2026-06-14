import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ReleaseCreateService } from '../../release-create.service';
import { Subject, takeUntil } from 'rxjs';
import { NgClass } from '@angular/common';
import { FlowCard } from '../flow-card/flow-card.component';
import { MatIcon } from "@angular/material/icon";
import { SeparatorComponent } from '@common/components/separator/separator.component';

@Component({
    selector: 'for-artist-release-create-what-next-card',
    standalone: true,
    templateUrl: './what-next-card.component.html',
    styleUrl: './what-next-card.component.scss',
    imports: [TranslatePipe, NgClass, MatIcon, SeparatorComponent],
})
export class ForArtistReleaseCreateWhatNextCardComponent implements OnInit, OnDestroy {
    @Input() flowCard: FlowCard | null = null;
    @Input() maxStage: number = 0;
    currentStage: number = 0;

    private readonly destroy$ = new Subject<void>();

    constructor(private readonly releaseCreateService: ReleaseCreateService) {}

    ngOnInit(): void {
        this.releaseCreateService.createState$
            .pipe(takeUntil(this.destroy$))
            .subscribe((state: number) => {
                this.currentStage = state;
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
