import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { loaderInterceptor } from './common/interceptors/loader.interceptor';
import { authInterceptor } from '@features/auth/interceptors/auth.interceptor';
import { credentialsInterceptor } from '@features/auth/interceptors/credential.interceptor';
import { provideAppStartupInitializer } from '@common/initializers/app-startup.initializer';
import { xsrfInterceptor } from '@features/auth/interceptors/xsrf.interceptor';

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideRouter(routes),
        provideHttpClient(
            // withXsrfConfiguration({
            //     cookieName: 'VOXXY-XSRF-TOKEN',
            //     headerName: 'X-XSRF-TOKEN',
            // }),                                  //production
            withInterceptors([loaderInterceptor, credentialsInterceptor, authInterceptor, xsrfInterceptor]),
        ),
        provideTranslateService(),
        provideAppStartupInitializer,
    ],
};
