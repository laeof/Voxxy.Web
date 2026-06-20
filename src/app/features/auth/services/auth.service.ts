import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LoginModel } from '../models/login';
import { User } from '../models/user';
import { ApiRoutes } from '@common/constants/api.routes.constant';
import { environment } from '@environments/environment';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    constructor(private readonly httpClient: HttpClient) {}

    public login(loginModel: LoginModel): Observable<User> {
        const url = `${environment.apiUrl}${ApiRoutes.Auth.login}`;
        return this.httpClient.post<User>(url, loginModel);
    }

    public logout(): Observable<void> {
        const url = `${environment.apiUrl}${ApiRoutes.Auth.logout}`;
        return this.httpClient.post<void>(url, {});
    }

    public me(): Observable<User> {
        const url = `${environment.apiUrl}${ApiRoutes.Users.me}`;
        return this.httpClient.get<User>(url);
    }

    public refreshToken(): Observable<User> {
        const url = `${environment.apiUrl}${ApiRoutes.Auth.refresh}`;
        return this.httpClient.post<User>(url, {});
    }

    public xsrfToken(): Observable<void> {
        const url = `${environment.apiUrl}${ApiRoutes.Auth.xsrf}`;
        return this.httpClient.get<void>(url);
    }
}
