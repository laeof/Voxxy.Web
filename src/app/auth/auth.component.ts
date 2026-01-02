import { Component } from '@angular/core';
import { LoginComponent } from './components/login/login.component';

@Component({
    selector: 'app-auth',
    templateUrl: './auth.component.html',
    styleUrl: './auth.component.scss',
    standalone: true,
    imports: [LoginComponent],
})
export class AuthComponent {}
