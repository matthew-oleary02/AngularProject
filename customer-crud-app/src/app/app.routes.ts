
import { Routes } from '@angular/router';
import { JobsListComponent } from './jobs/jobs-list/jobs-list';
import { JobsFormComponent } from './jobs/jobs-form/jobs-form';
import { JobsViewComponent } from './jobs/jobs-view/jobs-view';
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
import { CustomerCamsFormComponent } from './customers/customer-cams-form/customer-cams-form';
import { CustomerCamsViewComponent } from './customers/customer-cams-view/customer-cams-view';
import { CustomerNTEFormComponent } from './customers/customer-nte-form/customer-nte-form';
import { CustomerNTEViewComponent } from './customers/customer-nte-view/customer-nte-view';
import { CustomerETAFormComponent } from './customers/customer-eta-form/customer-eta-form';
import { CustomerETAViewComponent } from './customers/customer-eta-view/customer-eta-view';
import { CustomerRatesFormComponent } from './customers/customer-rates-form/customer-rates-form';
import { CustomerRatesViewComponent } from './customers/customer-rates-view/customer-rates-view';
import { ServiceTypesViewComponent } from './customers/service-types-view/service-types-view';
import { ServiceTypesFormComponent } from './customers/service-types-form/service-types-form';
import { EquipmentListComponent } from './customers/equipment-list/equipment-list';
import { EquipmentFormComponent } from './customers/equipment-form/equipment-form';
import { EquipmentViewComponent } from './customers/equipment-view/equipment-view';
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
  { path: 'jobs', component: JobsListComponent, canActivate: [AuthGuard] },
  { path: 'jobs/new', component: JobsFormComponent, canActivate: [AuthGuard] },
  { path: 'jobs/edit/:id', component: JobsFormComponent, canActivate: [AuthGuard] },
  { path: 'jobs/view/:id', component: JobsViewComponent, canActivate: [AuthGuard] },
  { path: 'purchase-orders', component: POListComponent, canActivate: [AuthGuard] },
  { path: 'purchase-orders/new', component: POFormComponent, canActivate: [AuthGuard] },
  { path: 'purchase-orders/edit/:id', component: POFormComponent, canActivate: [AuthGuard] },
  { path: 'purchase-orders/view/:id', component: POViewComponent, canActivate: [AuthGuard] },
  { path: 'customers', component: CustomerListComponent, canActivate: [AuthGuard] },
  { path: 'customers/new', component: CustomerFormComponent, canActivate: [AuthGuard] },
  { path: 'customers/edit/:id', component: CustomerFormComponent, canActivate: [AuthGuard] },
  { path: 'customers/view/:id', component: CustomerViewComponent, canActivate: [AuthGuard] },
  { path: 'customers/:id/jobs', component: CustomerViewComponent, canActivate: [AuthGuard] },
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
  { path : 'customer-cams/new', component: CustomerCamsFormComponent, canActivate: [AuthGuard]},
  { path : 'customer-cams/edit/:id', component: CustomerCamsFormComponent, canActivate: [AuthGuard]},
  { path : 'customer-cams/view/:id', component: CustomerCamsViewComponent, canActivate: [AuthGuard]},
  { path: 'customers/:id/customer-nte', component: CustomerViewComponent, canActivate: [AuthGuard]},
  { path : 'customer-nte/new', component: CustomerNTEFormComponent, canActivate: [AuthGuard]},
  { path : 'customer-nte/edit/:id', component: CustomerNTEFormComponent, canActivate: [AuthGuard]},
  { path : 'customer-nte/view/:id', component: CustomerNTEViewComponent, canActivate: [AuthGuard]},
  { path : 'customers/:id/customer-eta', component: CustomerViewComponent, canActivate: [AuthGuard]},
  { path : 'customer-eta/new', component: CustomerETAFormComponent, canActivate: [AuthGuard]},
  { path : 'customer-eta/edit/:id', component: CustomerETAFormComponent, canActivate: [AuthGuard]},
  { path : 'customer-eta/view/:id', component: CustomerETAViewComponent, canActivate: [AuthGuard]},
  { path : 'customers/:id/customer-rates', component: CustomerViewComponent, canActivate: [AuthGuard]},
  { path : 'customer-rates/new', component: CustomerRatesFormComponent, canActivate: [AuthGuard]},
  { path : 'customer-rates/edit/:id', component: CustomerRatesFormComponent, canActivate: [AuthGuard]},
  { path : 'customer-rates/view/:id', component: CustomerRatesViewComponent, canActivate: [AuthGuard]},
  { path : 'customers/:id/service-types', component: CustomerViewComponent, canActivate: [AuthGuard]},
  { path : 'service-types/view/:id', component: ServiceTypesViewComponent, canActivate: [AuthGuard]},
  { path : 'service-types/new', component: ServiceTypesFormComponent, canActivate: [AuthGuard]},
  { path : 'service-types/edit/:id', component: ServiceTypesFormComponent, canActivate: [AuthGuard]},
  { path : 'equipment', component: EquipmentListComponent, canActivate: [AuthGuard]},
  { path : 'equipment/new', component: EquipmentFormComponent, canActivate: [AuthGuard]},
  { path : 'equipment/edit/:id', component: EquipmentFormComponent, canActivate: [AuthGuard]},
  { path : 'equipment/view/:id', component: EquipmentViewComponent, canActivate: [AuthGuard]},
  { path: 'vendors', component: VendorListComponent, canActivate: [AuthGuard] },
  { path: 'vendors/new', component: VendorsFormComponent, canActivate: [AuthGuard] },
  { path: 'vendors/edit/:id', component: VendorsFormComponent, canActivate: [AuthGuard] },
  { path: 'vendors/view/:id', component: VendorsViewComponent, canActivate: [AuthGuard] },
  { path : 'offices', component: OfficesComponent, canActivate: [AuthGuard] },
  { path : 'offices/new', component: OfficesFormComponent, canActivate: [AuthGuard] },
  { path : 'offices/edit/:id', component: OfficesFormComponent, canActivate: [AuthGuard] },
  { path : 'offices/view/:id', component: OfficesViewComponent, canActivate: [AuthGuard] },
];
