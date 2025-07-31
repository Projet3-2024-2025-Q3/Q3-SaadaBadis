import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './sign-up/sign-up.component';

export const routes: Routes = [
  
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  
  
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  
  
  { path: '**', redirectTo: '/login' }
];