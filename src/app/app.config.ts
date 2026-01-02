import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { authInterceptor } from './auth/interceptors/auth.interceptor';
import { credentialsInterceptor } from './auth/interceptors/credential.interceptor';
import { provideAuthInitializer } from './auth/initializers/auth.initializer';
import { loaderInterceptor } from './common/interceptors/loader.interceptor';

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideRouter(routes),
        provideHttpClient(
            withInterceptors([loaderInterceptor, credentialsInterceptor, authInterceptor])
        ),
        provideTranslateService(),
        provideAuthInitializer,
    ],
};
