import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { catchError, throwError, switchMap, first } from 'rxjs';
import { UserStateService } from '@common/services/user-state.service';
import { ApiRoutes } from '@common/constants/api.routes.constant';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const auth = inject(AuthService);
    const userStateService = inject(UserStateService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401 && !req.url.endsWith(ApiRoutes.Auth.logout)) {
                console.log('token expired, refreshing token...');
                return auth.refreshToken().pipe(
                    switchMap((value) => {
                        console.log('refresh token created');
                        userStateService.set(value);
                        return next(req);
                    }),
                    catchError((refreshError) => {
                        //refresh token failed => error 403
                        console.log('refresh token failed, logging out...');
                        if (userStateService.value() !== null) {
                            auth.logout().pipe(first()).subscribe();
                            globalThis.location.reload();
                        }

                        return throwError(() => refreshError);
                    })
                );
            }
            if (error.status === 403) {
                console.log('forbidden');
            }
            return throwError(() => error);
        })
    );
};
