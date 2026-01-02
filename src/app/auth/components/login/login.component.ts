import { Component } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import { locale as english } from '../../i18n/en';
import { locale as russian } from '../../i18n/ru';
import { TranslationLoaderService } from '../../../common/services/translation-loader.service';
import { LogoComponent } from '../../../layout/components/topbar/components/logo/logo.component';
import { SnowComponent } from '../../../snow/snow.component';
import { AuthService } from '../../services/auth.service';
import { LoginModel } from '../../models/login';
import { User } from '../../models/user';
import { Router } from '@angular/router';
import { AppRoutes } from '../../../common/constants/app.routes.constant';
import { AppPermissions } from '../../../common/constants/permissions';
import { UserStateService } from '../../../common/services/user-state.service';

@Component({
    selector: 'auth-login',
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss',
    standalone: true,
    imports: [
        TranslatePipe,
        LogoComponent,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule,
        SnowComponent,
    ],
})
export class LoginComponent {
    loginForm: FormGroup;
    loading: boolean = false;

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly translationLoaderService: TranslationLoaderService,
        private readonly authService: AuthService,
        private readonly router: Router,
        private readonly userStateService: UserStateService
    ) {
        this.translationLoaderService.loadTranslations(english, russian);

        this.loginForm = new FormGroup({
            email: this.formBuilder.control<string>('', [Validators.required, Validators.email]),
            password: this.formBuilder.control<string>('', [Validators.required]),
        });
    }

    ngSubmit(): void {
        if (this.loginForm.valid) {
            this.loading = true;
            const loginData: LoginModel = this.loginForm.value;
            this.authService.login(loginData).subscribe((user: User) => {
                this.loading = false;
                //TODO: remove after backend implementation
                user.userClaims = [{ value: AppPermissions.UserActive }];
                this.authenticateUser(user);
            });
        } else {
            console.log('Form is invalid');
        }
    }

    private authenticateUser(user: User): void {
        this.userStateService.set(user);
        this.router.navigate([AppRoutes.layout]);
    }
}
