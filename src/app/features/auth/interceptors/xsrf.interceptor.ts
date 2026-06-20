import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CookieService } from '@common/services/cookie.service';

export const xsrfInterceptor: HttpInterceptorFn = (req, next) => {
    const cookieService = inject(CookieService);

    const xsrfToken = cookieService.getCookie('VOXXY-XSRF-TOKEN');

    if (!xsrfToken || ['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next(req);
    }

    return next(
        req.clone({
            withCredentials: true,
            headers: req.headers.set('X-XSRF-TOKEN', decodeURIComponent(xsrfToken)),
        }),
    );
};
