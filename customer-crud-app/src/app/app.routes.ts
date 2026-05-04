
import { Routes } from '@angular/router';
import { JobsListComponent } from './jobs/jobs-list/jobs-list';
import { JobsFormComponent } from './jobs/jobs-form/jobs-form';
import { JobsViewComponent } from './jobs/jobs-view/jobs-view';
import { POListComponent } from './purchaseOrder/purchase-order-list/purchase-order';
import { POFormComponent } from './purchaseOrder/purchase-order-form/purchase-order-form';
import { POViewComponent } from './purchaseOrder/purchase-order-view/purchase-order-view';
import { InvoiceItemsListComponent } from './purchaseOrder/invoice-items-list/invoice-items-list';
import { InvoiceItemsFormComponent } from './purchaseOrder/invoice-items-form/invoice-items-form';
import { InvoiceItemsViewComponent } from './purchaseOrder/invoice-items-view/invoice-items-view';
import { CustomerListComponent } from './customers/customer-list/customer-list';
import { CustomerFormComponent } from './customers/customer-form/customer-form';
import { CustomerViewComponent } from './customers/customer-view/customer-view';
import { LocationListComponent } from './customers/location-list/location-list';
import { LocationViewComponent } from './customers/location-view/location-view';
import { LocationFormComponent } from './customers/location-form/location-form';
import { CSMFormComponent } from './customers/status-messages-form/status-messages-form';
import { CSMViewComponent } from './customers/status-messages-view/status-message-view';
import { CustomerCamsListComponent } from './customers/customer-cams-list/customer-cams-list';
import { CustomerCamsFormComponent } from './customers/customer-cams-form/customer-cams-form';
import { CustomerCamsViewComponent } from './customers/customer-cams-view/customer-cams-view';
import { CustomerNTEFormComponent } from './customers/customer-nte-form/customer-nte-form';
import { CustomerNTEViewComponent } from './customers/customer-nte-view/customer-nte-view';
import { CustomerETAFormComponent } from './customers/customer-eta-form/customer-eta-form';
import { CustomerETAViewComponent } from './customers/customer-eta-view/customer-eta-view';
import { CustomerRatesFormComponent } from './customers/customer-rates-form/customer-rates-form';
import { CustomerRatesViewComponent } from './customers/customer-rates-view/customer-rates-view';
import { CustomerNotifsFormComponent } from './customers/customer-notifs-form/customer-notifs-form';
import { CustomerNotifsViewComponent } from './customers/customer-notifs-view/customer-notifs-view';
import { ServiceTypesViewComponent } from './customers/service-types-view/service-types-view';
import { ServiceTypesFormComponent } from './customers/service-types-form/service-types-form';
import { EquipmentListComponent } from './customers/equipment-list/equipment-list';
import { EquipmentFormComponent } from './customers/equipment-form/equipment-form';
import { EquipmentViewComponent } from './customers/equipment-view/equipment-view';
import { VendorListComponent } from './vendors/vendors/vendors';
import { VendorsFormComponent } from './vendors/vendors-form/vendors-form';
import { VendorsViewComponent } from './vendors/vendors-view/vendors-view';
import { OfficesComponent } from './resources/office-list/offices';
import { OfficesFormComponent } from './resources/offices-form/offices-form';
import { OfficesViewComponent } from './resources/offices-view/offices-view';
import { VehiclesFormComponent } from './resources/vehicles-form/vehicles-form';
import { VehiclesListComponent } from './resources/vehicles-list/vehicles-list';
import { VehiclesViewComponent } from './resources/vehicles-view/vehicles-view';
import { ResourcesFormComponent } from './resources/resources-form/resources-form';
import { ResourcesListComponent } from './resources/resources-list/resources-list';
import { ResourcesViewComponent } from './resources/resources-view/resources-view';
import { ReportGroupsFormComponent } from './resources/report-groups-form/report-groups-form';
import { ReportGroupsListComponent } from './resources/report-groups-list/report-groups-list';
import { ReportGroupsViewComponent } from './resources/report-groups-view/report-groups-view';
import { TabletUsersFormComponent } from './resources/tablet-users-form/tablet-users-form';
import { TabletUsersListComponent } from './resources/tablet-users-list/tablet-users-list';
import { TabletUsersViewComponent } from './resources/tablet-users-view/tablet-users-view';
import { ResourceProductivityViewComponent } from './resources/resource-productivity-view/resource-productivity-view';
import { ResourceProductivityListComponent } from './resources/resource-productivity-list/resource-productivity-list';
import { ResourceProductivityFormComponent } from './resources/resource-productivity-form/resource-productivity-form';
import { VendorCoverageListComponent } from './vendors/vendor-coverage-list/vendor-coverage-list';
import { VendorCoverageFormComponent } from './vendors/vendor-coverage-form/vendor-coverage-form';
import { VendorCoverageViewComponent } from './vendors/vendor-coverage-view/vendor-coverage-view';
import { VendorMapListComponent } from './vendors/vendor-map-list/vendor-map-list';
import { VendorMapFormComponent } from './vendors/vendor-map-form/vendor-map-form';
import { VendorMapViewComponent } from './vendors/vendor-map-view/vendor-map-view';
import { VendorUsersListComponent } from './vendors/vendor-users-list/vendor-users-list';
import { VendorUsersFormComponent } from './vendors/vendor-users-form/vendor-users-form';
import { VendorUsersViewComponent } from './vendors/vendor-users-view/vendor-users-view';
import { VendorNotesListComponent } from './vendors/vendor-notes-list/vendor-notes-list';
import { VendorNotesFormComponent } from './vendors/vendor-notes-form/vendor-notes-form';
import { VendorNotesViewComponent } from './vendors/vendor-notes-view/vendor-notes-view';
import { VendorAssetListComponent } from './vendors/vendor-asset-list/vendor-asset-list';
import { VendorAssetFormComponent } from './vendors/vendor-asset-form/vendor-asset-form';
import { VendorAssetViewComponent } from './vendors/vendor-asset-view/vendor-asset-view';
import { VendorClassificationFormComponent } from './vendors/vendor-classification-form/vendor-classification-form';
import { VendorClassificationViewComponent } from './vendors/vendor-classification-view/vendor-classification-view';
import { VendorContractStatusFormComponent } from './vendors/vendor-contract-status-form/vendor-contract-status-form';
import { VendorContractStatusViewComponent } from './vendors/vendor-contract-status-view/vendor-contract-status-view';
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
  { path: 'invoice-items', component: InvoiceItemsListComponent, canActivate: [AuthGuard] },
  { path: 'invoice-items/new', component: InvoiceItemsFormComponent, canActivate: [AuthGuard] },
  { path: 'invoice-items/edit/:id', component: InvoiceItemsFormComponent, canActivate: [AuthGuard] },
  { path: 'invoice-items/view/:id', component: InvoiceItemsViewComponent, canActivate: [AuthGuard] },
  { path: 'customers', component: CustomerListComponent, canActivate: [AuthGuard] },
  { path: 'customers/new', component: CustomerFormComponent, canActivate: [AuthGuard] },
  { path: 'customers/edit/:id', component: CustomerFormComponent, canActivate: [AuthGuard] },
  { path: 'customers/view/:id', component: CustomerViewComponent, canActivate: [AuthGuard] },
  { path: 'customers/:id/jobs', component: CustomerViewComponent, canActivate: [AuthGuard] },
  { path: 'customers/:id/locations', component: LocationListComponent, canActivate: [AuthGuard] },
  { path: 'locations', component: LocationListComponent, canActivate: [AuthGuard] },
  { path: 'locations/view/:id', component: LocationViewComponent, canActivate: [AuthGuard] },
  { path: 'locations/new', component: LocationFormComponent, canActivate: [AuthGuard] },
  { path: 'locations/edit/:id', component: LocationFormComponent, canActivate: [AuthGuard] },
  { path: 'customers/:id/status-messages', component: CustomerViewComponent, canActivate: [AuthGuard] },
  { path: 'status-messages/new', component: CSMFormComponent, canActivate: [AuthGuard] },
  { path: 'status-messages/edit/:id', component: CSMFormComponent, canActivate: [AuthGuard] },
  { path: 'status-messages/view/:id', component: CSMViewComponent, canActivate: [AuthGuard] },
  { path: 'customers/:id/customer-cams', component: CustomerViewComponent, canActivate: [AuthGuard] },
  { path: 'customer-cams', component: CustomerCamsListComponent, canActivate: [AuthGuard] },
  { path: 'customer-cams/new', component: CustomerCamsFormComponent, canActivate: [AuthGuard] },
  { path: 'customer-cams/edit/:id', component: CustomerCamsFormComponent, canActivate: [AuthGuard] },
  { path: 'customer-cams/view/:id', component: CustomerCamsViewComponent, canActivate: [AuthGuard] },
  { path: 'customers/:id/customer-nte', component: CustomerViewComponent, canActivate: [AuthGuard] },
  { path: 'customer-nte/new', component: CustomerNTEFormComponent, canActivate: [AuthGuard] },
  { path: 'customer-nte/edit/:id', component: CustomerNTEFormComponent, canActivate: [AuthGuard] },
  { path: 'customer-nte/view/:id', component: CustomerNTEViewComponent, canActivate: [AuthGuard] },
  { path: 'customers/:id/customer-eta', component: CustomerViewComponent, canActivate: [AuthGuard] },
  { path: 'customer-eta/new', component: CustomerETAFormComponent, canActivate: [AuthGuard] },
  { path: 'customer-eta/edit/:id', component: CustomerETAFormComponent, canActivate: [AuthGuard] },
  { path: 'customer-eta/view/:id', component: CustomerETAViewComponent, canActivate: [AuthGuard] },
  { path: 'customers/:id/customer-rates', component: CustomerViewComponent, canActivate: [AuthGuard] },
  { path: 'customer-rates/new', component: CustomerRatesFormComponent, canActivate: [AuthGuard] },
  { path: 'customer-rates/edit/:id', component: CustomerRatesFormComponent, canActivate: [AuthGuard] },
  { path: 'customer-rates/view/:id', component: CustomerRatesViewComponent, canActivate: [AuthGuard] },
  { path: 'customers/:id/service-types', component: CustomerViewComponent, canActivate: [AuthGuard] },
  { path: 'customers/:id/customer-notifs', component: CustomerViewComponent, canActivate: [AuthGuard] },
  { path: 'customer-notifs/new', component: CustomerNotifsFormComponent, canActivate: [AuthGuard] },
  { path: 'customer-notifs/edit/:id', component: CustomerNotifsFormComponent, canActivate: [AuthGuard] },
  { path: 'customer-notifs/view/:id', component: CustomerNotifsViewComponent, canActivate: [AuthGuard] },
  { path: 'service-types/view/:id', component: ServiceTypesViewComponent, canActivate: [AuthGuard] },
  { path: 'service-types/new', component: ServiceTypesFormComponent, canActivate: [AuthGuard] },
  { path: 'service-types/edit/:id', component: ServiceTypesFormComponent, canActivate: [AuthGuard] },
  { path: 'equipment', component: EquipmentListComponent, canActivate: [AuthGuard] },
  { path: 'equipment/new', component: EquipmentFormComponent, canActivate: [AuthGuard] },
  { path: 'equipment/edit/:id', component: EquipmentFormComponent, canActivate: [AuthGuard] },
  { path: 'equipment/view/:id', component: EquipmentViewComponent, canActivate: [AuthGuard] },
  { path: 'vendors', component: VendorListComponent, canActivate: [AuthGuard] },
  { path: 'vendors/new', component: VendorsFormComponent, canActivate: [AuthGuard] },
  { path: 'vendors/edit/:id', component: VendorsFormComponent, canActivate: [AuthGuard] },
  { path: 'vendors/view/:id', component: VendorsViewComponent, canActivate: [AuthGuard] },
  { path: 'offices', component: OfficesComponent, canActivate: [AuthGuard] },
  { path: 'offices/new', component: OfficesFormComponent, canActivate: [AuthGuard] },
  { path: 'offices/edit/:id', component: OfficesFormComponent, canActivate: [AuthGuard] },
  { path: 'offices/view/:id', component: OfficesViewComponent, canActivate: [AuthGuard] },
  { path: 'vehicles', component: VehiclesListComponent, canActivate: [AuthGuard] },
  { path: 'vehicles/new', component: VehiclesFormComponent, canActivate: [AuthGuard] },
  { path: 'vehicles/edit/:id', component: VehiclesFormComponent, canActivate: [AuthGuard] },
  { path: 'vehicles/view/:id', component: VehiclesViewComponent, canActivate: [AuthGuard] },
  { path: 'resources', component: ResourcesListComponent, canActivate: [AuthGuard] },
  { path: 'resources/new', component: ResourcesFormComponent, canActivate: [AuthGuard] },
  { path: 'resources/edit/:id', component: ResourcesFormComponent, canActivate: [AuthGuard] },
  { path: 'resources/view/:id', component: ResourcesViewComponent, canActivate: [AuthGuard] },
  { path: 'report-groups', component: ReportGroupsListComponent, canActivate: [AuthGuard] },
  { path: 'report-groups/new', component: ReportGroupsFormComponent, canActivate: [AuthGuard] },
  { path: 'report-groups/edit/:id', component: ReportGroupsFormComponent, canActivate: [AuthGuard] },
  { path: 'report-groups/view/:id', component: ReportGroupsViewComponent, canActivate: [AuthGuard] },
  { path: 'tablet-users', component: TabletUsersListComponent, canActivate: [AuthGuard] },
  { path: 'tablet-users/new', component: TabletUsersFormComponent, canActivate: [AuthGuard] },
  { path: 'tablet-users/edit/:id', component: TabletUsersFormComponent, canActivate: [AuthGuard] },
  { path: 'tablet-users/view/:id', component: TabletUsersViewComponent, canActivate: [AuthGuard] },
  { path: 'resource-productivity', component: ResourceProductivityListComponent, canActivate: [AuthGuard] },
  { path: 'resource-productivity/new', component: ResourceProductivityFormComponent, canActivate: [AuthGuard] },
  { path: 'resource-productivity/edit/:id', component: ResourceProductivityFormComponent, canActivate: [AuthGuard] },
  { path: 'resource-productivity/view/:id', component: ResourceProductivityViewComponent, canActivate: [AuthGuard] },
  { path: 'vendor-coverage', component: VendorCoverageListComponent, canActivate: [AuthGuard] },
  { path: 'vendor-coverage/new', component: VendorCoverageFormComponent, canActivate: [AuthGuard] },
  { path: 'vendor-coverage/edit/:id', component: VendorCoverageFormComponent, canActivate: [AuthGuard] },
  { path: 'vendor-coverage/view/:id', component: VendorCoverageViewComponent, canActivate: [AuthGuard] },
  { path: 'vendor-maps', component: VendorMapListComponent, canActivate: [AuthGuard] },
  { path: 'vendor-maps/new', component: VendorMapFormComponent, canActivate: [AuthGuard] },
  { path: 'vendor-maps/edit/:id', component: VendorMapFormComponent, canActivate: [AuthGuard] },
  { path: 'vendor-maps/view/:id', component: VendorMapViewComponent, canActivate: [AuthGuard] },
  { path: 'vendor-users', component: VendorUsersListComponent, canActivate: [AuthGuard] },
  { path: 'vendor-users/new', component: VendorUsersFormComponent, canActivate: [AuthGuard] },
  { path: 'vendor-users/edit/:id', component: VendorUsersFormComponent, canActivate: [AuthGuard] },
  { path: 'vendor-users/view/:id', component: VendorUsersViewComponent, canActivate: [AuthGuard] },
  { path: 'vendors/:id/vendor-users', component: VendorsViewComponent, canActivate: [AuthGuard] },
  { path: 'vendor-notes', component: VendorNotesListComponent, canActivate: [AuthGuard] },
  { path: 'vendor-notes/new', component: VendorNotesFormComponent, canActivate: [AuthGuard] },
  { path: 'vendor-notes/edit/:id', component: VendorNotesFormComponent, canActivate: [AuthGuard] },
  { path: 'vendor-notes/view/:id', component: VendorNotesViewComponent, canActivate: [AuthGuard] },
  { path: 'vendors/:id/vendor-notes', component: VendorsViewComponent, canActivate: [AuthGuard] },
  { path: 'vendor-assets', component: VendorAssetListComponent, canActivate: [AuthGuard] },
  { path: 'vendor-assets/new', component: VendorAssetFormComponent, canActivate: [AuthGuard] },
  { path: 'vendor-assets/edit/:id', component: VendorAssetFormComponent, canActivate: [AuthGuard] },
  { path: 'vendor-assets/view/:id', component: VendorAssetViewComponent, canActivate: [AuthGuard] },
  { path: 'vendor-classification/new', component: VendorClassificationFormComponent, canActivate: [AuthGuard] },
  { path: 'vendor-classification/edit/:id', component: VendorClassificationFormComponent, canActivate: [AuthGuard] },
  { path: 'vendor-classification/view/:id', component: VendorClassificationViewComponent, canActivate: [AuthGuard] },
  { path: 'vendor-contract-status/new', component: VendorContractStatusFormComponent, canActivate: [AuthGuard] },
  { path: 'vendor-contract-status/edit/:id', component: VendorContractStatusFormComponent, canActivate: [AuthGuard] },
  { path: 'vendor-contract-status/view/:id', component: VendorContractStatusViewComponent, canActivate: [AuthGuard] },
];
