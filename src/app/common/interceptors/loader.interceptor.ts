import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoaderService } from '../services/loader.service';

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
    const loader = inject(LoaderService);

    if (req.headers.has('x-skeleton-loader')) {
        return next(req);
    }

    loader.start();

    return next(req).pipe(finalize(() => loader.stop()));
};
