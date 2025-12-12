export interface Vendor {
  rowId: number;
  vendorName: string;
  billingAddress: {
    address1: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
    county: string;
    country: string;
    email: string;
  };
  primaryContact: {
    name: string;
    phone: string;
    email: string;
  };
  vendorType: string;
  status: string;
  statusNote: string;
  createdBy?: string;
  createdOn?: Date;
  modifiedBy?: string;
  modifiedOn?: Date;
}