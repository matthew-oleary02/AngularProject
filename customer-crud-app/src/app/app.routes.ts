
import { Routes } from '@angular/router';
import { POListComponent } from './purchaseOrder/purchase-order-list/purchase-order';
import { POFormComponent } from './purchaseOrder/purchase-order-form/purchase-order-form';
import { POViewComponent } from './purchaseOrder/purchase-order-view/purchase-order-view';
import { CustomerListComponent } from './customers/customer-list/customer-list';
import { CustomerFormComponent } from './customers/customer-form/customer-form';
import { CustomerViewComponent } from './customers/customer-view/customer-view';
import { LocationListComponent } from './customers/location-list/location-list';
import { LocationViewComponent } from './customers/location-view/location-view';
import { LocationFormComponent } from './customers/location-form/location-form';
import { CSMFormComponent } from './customers/status-messages-form/status-messages-form';
import { CSMViewComponent } from './customers/status-messages-view/status-message-view';
import { CustomerCAMsService } from './customers/customer-cams.service';
import { VendorListComponent } from './vendors/vendors/vendors';
import { VendorsFormComponent } from './vendors/vendors-form/vendors-form';
import { VendorsViewComponent } from './vendors/vendors-view/vendors-view';
import { OfficesComponent } from './resources/resources/offices';
import { OfficesFormComponent } from './resources/offices-form/offices-form';
import { OfficesViewComponent } from './resources/offices-view/offices-view';
import { LoginComponent } from './index/login/login';
import { HomeComponent } from './index/home/home';
import { ProfileComponent } from './profile/profile/profile';
import { ProfileFormComponent } from './profile/profile-form/profile-form';
import { AdminComponent } from './admin/admin/admin';
import { AdminFormComponent } from './admin/admin-form/admin-form';
import { AdminViewComponent } from './admin/admin-view/admin-view';
import { RolesComponent } from './admin/roles/roles';
import { RolesFormComponent } from './admin/roles-form/roles-form';
import { RolesViewComponent } from './admin/roles-view/roles-view';
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
  { path: 'admin/view/:id', component: AdminViewComponent, canActivate: [AuthGuard] },
  { path: 'roles', component: RolesComponent, canActivate: [AuthGuard] },
  { path: 'roles/new', component: RolesFormComponent, canActivate: [AuthGuard] },
  { path: 'roles/edit/:id', component: RolesFormComponent, canActivate: [AuthGuard] },
  { path: 'roles/view/:id', component: RolesViewComponent, canActivate: [AuthGuard] },
  { path: 'purchase-orders', component: POListComponent, canActivate: [AuthGuard] },
  { path: 'purchase-orders/new', component: POFormComponent, canActivate: [AuthGuard] },
  { path: 'purchase-orders/edit/:id', component: POFormComponent, canActivate: [AuthGuard] },
  { path: 'purchase-orders/view/:id', component: POViewComponent, canActivate: [AuthGuard] },
  { path: 'customers', component: CustomerListComponent, canActivate: [AuthGuard] },
  { path: 'customers/new', component: CustomerFormComponent, canActivate: [AuthGuard] },
  { path: 'customers/edit/:id', component: CustomerFormComponent, canActivate: [AuthGuard] },
  { path: 'customers/view/:id', component: CustomerViewComponent, canActivate: [AuthGuard] },
  { path: 'customers/:id/locations', component: LocationListComponent, canActivate: [AuthGuard]},
  { path: 'locations', component: LocationListComponent, canActivate: [AuthGuard]},
  { path: 'locations/view/:id', component: LocationViewComponent, canActivate: [AuthGuard]},
  { path: 'locations/new', component: LocationFormComponent, canActivate: [AuthGuard]},
  { path: 'locations/edit/:id', component: LocationFormComponent, canActivate: [AuthGuard]},
  { path: 'customers/:id/status-messages', component: CustomerViewComponent, canActivate: [AuthGuard]},
  { path: 'status-messages/new', component: CSMFormComponent, canActivate: [AuthGuard]},
  { path: 'status-messages/edit/:id', component: CSMFormComponent, canActivate: [AuthGuard]},
  { path : 'status-messages/view/:id', component: CSMViewComponent, canActivate: [AuthGuard]},
  { path: 'customers/:id/customer-cams', component: CustomerViewComponent, canActivate: [AuthGuard]},
  { path: 'vendors', component: VendorListComponent, canActivate: [AuthGuard] },
  { path: 'vendors/new', component: VendorsFormComponent, canActivate: [AuthGuard] },
  { path: 'vendors/edit/:id', component: VendorsFormComponent, canActivate: [AuthGuard] },
  { path: 'vendors/view/:id', component: VendorsViewComponent, canActivate: [AuthGuard] },
  { path : 'offices', component: OfficesComponent, canActivate: [AuthGuard] },
  { path : 'offices/new', component: OfficesFormComponent, canActivate: [AuthGuard] },
  { path : 'offices/edit/:id', component: OfficesFormComponent, canActivate: [AuthGuard] },
  { path : 'offices/view/:id', component: OfficesViewComponent, canActivate: [AuthGuard] },
];
