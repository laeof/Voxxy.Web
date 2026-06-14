import { NgClass } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { ReleaseCreateService } from '../../release-create.service';

export interface FlowCard {
    title: string;
    subtitle: string | null;
    stage: number;
}

@Component({
    selector: 'for-artist-release-create-flow-card',
    standalone: true,
    templateUrl: './flow-card.component.html',
    styleUrl: './flow-card.component.scss',
    imports: [TranslatePipe, MatIcon, NgClass],
})
export class ForArtistReleaseCreateFlowCardComponent implements OnInit, OnDestroy {
    @Input() flowCard: FlowCard | null = null;
    currentStage: number = 0;

    private readonly destroy$ = new Subject<void>();

    constructor(private readonly releaseCreateService: ReleaseCreateService) {}

    ngOnInit(): void {
        this.releaseCreateService.createState$.pipe(takeUntil(this.destroy$)).subscribe((state: number) => {
            this.currentStage = state;
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
