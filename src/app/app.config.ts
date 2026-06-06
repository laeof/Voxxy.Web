import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { loaderInterceptor } from './common/interceptors/loader.interceptor';
import { provideAuthInitializer } from '@features/auth/initializers/auth.initializer';
import { authInterceptor } from '@features/auth/interceptors/auth.interceptor';
import { credentialsInterceptor } from '@features/auth/interceptors/credential.interceptor';
import { provideArtistInitializer } from '@features/for-artist/initializers/artist.initializer';

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideRouter(routes),
        provideHttpClient(
            withInterceptors([loaderInterceptor, credentialsInterceptor, authInterceptor])
        ),
        provideTranslateService(),
        provideAuthInitializer,
        provideArtistInitializer,
    ],
};
