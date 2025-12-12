
import { Routes } from '@angular/router';
import { POListComponent } from './purchaseOrder/purchase-order-list/purchase-order';
import { CustomerListComponent } from './customers/customer-list/customer-list';
import { CustomerFormComponent } from './customers/customer-form/customer-form';
import { CustomerViewComponent } from './customers/customer-view/customer-view';
import { VendorListComponent } from './vendors/vendors/vendors';
import { VendorsFormComponent } from './vendors/vendors-form/vendors-form';
import { VendorsViewComponent } from './vendors/vendors-view/vendors-view';
import { OfficesComponent } from './resources/resources/offices';
import { OfficesFormComponent } from './resources/offices-form/offices-form';
import { LoginComponent } from './index/login/login';
import { HomeComponent } from './index/home/home';
import { ProfileComponent } from './profile/profile/profile';
import { ProfileFormComponent } from './profile/profile-form/profile-form';
import { AdminComponent } from './admin/admin/admin';
import { AdminFormComponent } from './admin/admin-form/admin-form';
import { AuthGuard } from './core/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'profile/edit', component: ProfileFormComponent, canActivate: [AuthGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [AuthGuard] },
  { path: 'admin/new', component: AdminFormComponent, canActivate: [AuthGuard] },
  { path: 'admin/edit/:id', component: AdminFormComponent, canActivate: [AuthGuard] },
  { path: 'purchase-orders', component: POListComponent, canActivate: [AuthGuard] },
  { path: 'customers', component: CustomerListComponent, canActivate: [AuthGuard] },
  { path: 'customers/new', component: CustomerFormComponent, canActivate: [AuthGuard] },
  { path: 'customers/edit/:id', component: CustomerFormComponent, canActivate: [AuthGuard] },
  { path: 'customers/view/:id', component: CustomerViewComponent, canActivate: [AuthGuard] },
  { path: 'vendors', component: VendorListComponent, canActivate: [AuthGuard] },
  { path: 'vendors/new', component: VendorsFormComponent, canActivate: [AuthGuard] },
  { path: 'vendors/edit/:id', component: VendorsFormComponent, canActivate: [AuthGuard] },
  { path: 'vendors/view/:id', component: VendorsViewComponent, canActivate: [AuthGuard] },
  { path : 'offices', component: OfficesComponent, canActivate: [AuthGuard] },
  { path : 'offices/new', component: OfficesFormComponent, canActivate: [AuthGuard] },
  { path : 'offices/edit/:id', component: OfficesFormComponent, canActivate: [AuthGuard] },
];
