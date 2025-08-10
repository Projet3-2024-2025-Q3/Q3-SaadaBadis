import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './sign-up/sign-up.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CreateRequestComponent } from './create-request/create-request.component';
import { MyRequestsComponent } from './my-requests/my-requests.component';
import { RequestDetailsDialogComponent } from './request-details-dialog/request-details-dialog.component';
import { ManagerDashboardComponent } from './manager-dashboard/manager-dashboard.component';

export const routes: Routes = [
  
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  
  
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'forgot', component: ForgotPasswordComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'create', component: CreateRequestComponent },
  { path: 'myrequests', component: MyRequestsComponent },
  { path: 'request-details', component: RequestDetailsDialogComponent },
  { path: 'manager-dashboard', component: ManagerDashboardComponent },
  { path: 'myrequests-manager', component: MyRequestsComponent },
  
  
  
  { path: '**', redirectTo: '/login' }
];