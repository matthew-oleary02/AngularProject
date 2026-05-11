// Domain model for VendorNotifications entity
export interface VendorNotifications {
  rowId: number;
  vendorName: string;
  status: string;
  serviceType: string;
  serviceClass: string;
  email: string;
  createdOn: Date;
  createdBy: string;
  modifiedOn: Date;
  modifiedBy: string;
}
