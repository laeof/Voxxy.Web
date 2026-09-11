import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { LogoComponent } from './components/logo/logo.component';
import { TranslatePipe } from '@ngx-translate/core';
import { locale as english } from './i18n/en';
import { locale as russian } from './i18n/ru';
import { locale as ukrainian } from './i18n/ua';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { MatDivider } from '@angular/material/divider';
import { AuthorizeDirective } from '@common/directives/authorize.directive';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { SnowComponent } from '@common/components/snow/snow.component';
import { AppRoutes } from '@common/constants/app.routes.constant';
import { AppPermissions } from '@common/constants/permissions';
import { AnonymousDirective } from '@common/directives/anonymous.directive';
import { NavigationService } from '@common/services/navigation.service';
import { TranslationLoaderService } from '@common/services/translation-loader.service';
import { UserStateService } from '@common/services/user-state.service';
import { AuthService } from '@features/auth/services/auth.service';
import { GlobalSearchService } from '@common/services/global-search.service';
import { GlobalSearchComponent } from './components/global-search/global-search.component';
import { ConnectHubService } from '@common/connect/transport/connect-hub.service';

@Component({
    selector: 'layout-topbar',
    standalone: true,
    templateUrl: './topbar.component.html',
    styleUrl: './topbar.component.scss',
    imports: [
        LogoComponent,
        MatIcon,
        TranslatePipe,
        SnowComponent,
        AuthorizeDirective,
        AnonymousDirective,
        MatMenu,
        MatMenuTrigger,
        MatDivider,
        GlobalSearchComponent,
    ],
})
export class TopBarComponent implements OnInit, OnDestroy {
    isHome: boolean = false;
    readonly permissions = AppPermissions;

    private readonly destroy$ = new Subject<void>();

    constructor(
        private readonly translationLoaderService: TranslationLoaderService,
        private readonly navigationService: NavigationService,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly authService: AuthService,
        private readonly globalSearchService: GlobalSearchService,
        private readonly connectHub: ConnectHubService,
        public userStateService: UserStateService,
    ) {
        this.translationLoaderService.loadTranslations(english, russian, ukrainian);
    }

    ngOnInit(): void {
        const child = this.route.firstChild;
        this.isHome = child?.snapshot.data['page'] === AppRoutes.home;

        this.router.events
            .pipe(
                filter((e) => e instanceof NavigationEnd),
                takeUntil(this.destroy$),
            )
            .subscribe(() => {
                const child = this.route.firstChild;
                this.isHome = child?.snapshot.data['page'] === AppRoutes.home;
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    navigateHome(): void {
        this.navigationService.navigateHome();
    }

    navigateLogin(): void {
        this.navigationService.navigateLogin();
    }

    navigateRegister(): void {
        this.navigationService.navigateRegister();
    }

    logout() {
        void this.connectHub.disconnectGracefully().finally(() => {
            this.authService
                .logout()
                .pipe(takeUntil(this.destroy$))
                .subscribe(() => this.userStateService.clear());
        });
    }

    navigateUserProfile() {
        this.navigationService.navigateUserProfileById(this.userStateService.value()?.id ?? '');
    }

    navigateForArtist(): void {
        this.navigationService.navigateForArtist(AppRoutes.forArtist);
    }
}
