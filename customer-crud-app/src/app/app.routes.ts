
import { Routes } from '@angular/router';
import { CustomerListComponent } from './customers/customer-list/customer-list';
import { CustomerFormComponent } from './customers/customer-form/customer-form';
import { CustomerViewComponent } from './customers/customer-view/customer-view';
import { LoginComponent } from './customers/login/login';
import { ProfileComponent } from './customers/profile/profile';
import { ProfileFormComponent } from './customers/profile-form/profile-form';
import { AdminComponent } from './customers/admin/admin';
import { AdminFormComponent } from './customers/admin-form/admin-form';
import { AuthGuard } from './core/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'profile/edit', component: ProfileFormComponent, canActivate: [AuthGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [AuthGuard] },
  { path: 'admin/new', component: AdminFormComponent, canActivate: [AuthGuard] },
  { path: 'admin/edit/:id', component: AdminFormComponent, canActivate: [AuthGuard] },
  { path: 'customers', component: CustomerListComponent, canActivate: [AuthGuard] },
  { path: 'customers/new', component: CustomerFormComponent, canActivate: [AuthGuard] },
  { path: 'customers/edit/:id', component: CustomerFormComponent, canActivate: [AuthGuard] },
  { path: 'customers/view/:id', component: CustomerViewComponent, canActivate: [AuthGuard] }
];
