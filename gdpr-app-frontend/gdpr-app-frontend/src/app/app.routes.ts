import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './sign-up/sign-up.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CreateRequestComponent } from './create-request/create-request.component';
import { MyRequestsComponent } from './my-requests/my-requests.component';
import { RequestDetailsDialogComponent } from './request-details-dialog/request-details-dialog.component';
import { ManagerDashboardComponent } from './manager-dashboard/manager-dashboard.component';
import { ManagerRequestsComponent } from './my-requests-manager/my-requests-manager.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { ManageUsersComponent } from './manage-users/manage-users.component';
import { UserFormDialogComponent } from './user-dialog-component/user-dialog-component.component';
import { ManageCompaniesComponent } from './manage-companies/manage-companies.component';
import { ChangePasswordComponent } from './change-password/change-password.component';

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
  { path: 'myrequests-manager', component: ManagerRequestsComponent},
  { path: 'admin-dashboard', component: AdminDashboardComponent},
  { path: 'manage-users', component: ManageUsersComponent},
  { path: 'form-user', component: UserFormDialogComponent},
  { path: 'manage-companies', component: ManageCompaniesComponent},
  { path: 'change-password', component: ChangePasswordComponent},
  
  
  
  { path: '**', redirectTo: '/login' }
];