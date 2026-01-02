import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { catchError, throwError, switchMap, first } from 'rxjs';
import { NavigationService } from '../../common/services/navigation.service';
import { ApiRoutes } from '../../common/constants/api.routes.constant';
import { UserStateService } from '../../common/services/user-state.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const auth = inject(AuthService);
    const navigation = inject(NavigationService);
    const userStateService = inject(UserStateService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401 && !req.url.endsWith(ApiRoutes.Auth.logout)) {
                console.log('token expired, refreshing token...');
                return auth.refreshToken().pipe(
                    switchMap(() => {
                        console.log('refresh token created');
                        return next(req);
                    }),
                    catchError((refreshError) => {
                        //refresh token failed => error 403
                        if (userStateService.value() !== null) {
                            auth.logout().pipe(first()).subscribe();
                            navigation.navigateLogin();
                        }

                        return throwError(() => refreshError);
                    })
                );
            }
            if (error.status === 403) {
                console.log('error creating refresh token, logging out...');
            }
            return throwError(() => error);
        })
    );
};
