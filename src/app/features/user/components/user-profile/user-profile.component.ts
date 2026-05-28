import { Component, OnDestroy, OnInit } from '@angular/core';
import { SingleEntityFacade } from '@common/facades/single-entity.facade';
import { User } from '@features/auth/models/user';
import { UserProfileService } from '@features/user/services/user-profile.service';
import { ManagerSkeletonComponent } from '@common/components/manager/manager-skeleton/manager-skeleton.component';
import { UserProfileManagerComponent } from './components/user-profile-manager/user-profile-manager.component';
import { AsyncPipe } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { TranslationLoaderService } from '@common/services/translation-loader.service';
import { locale as english } from '../../i18n/en';
import { locale as russian } from '../../i18n/ru';

@Component({
    selector: 'app-user-profile',
    templateUrl: './user-profile.component.html',
    standalone: true,
    imports: [AsyncPipe, ManagerSkeletonComponent, UserProfileManagerComponent],
})
export class UserProfileComponent extends SingleEntityFacade<User> implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();

    constructor(
        private readonly userProfileService: UserProfileService,
        private readonly route: ActivatedRoute,
        private readonly translationLoaderService: TranslationLoaderService,
    ) {
        super(userProfileService);
    }

    ngOnInit(): void {
        this.translationLoaderService.loadTranslations(english, russian);

        this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
            let id = params.get('id');
            if (id != null) {
                this.userProfileService.getUserById(id);
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
