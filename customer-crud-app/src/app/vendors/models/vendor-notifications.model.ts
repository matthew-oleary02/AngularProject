// Domain model for VendorNotifications entity
export interface VendorNotifications {
  rowId: number;
  vendorId: string;
  vendor: string;
  status: string;
  serviceType: string;
  serviceClass: string;
  email: string;
  createdOn: Date;
  createdBy: string;
  modifiedOn: Date;
  modifiedBy: string;
}
