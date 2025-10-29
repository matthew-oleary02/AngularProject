export interface Customer {
  rowId: number;
  customerName: string;
  billingAddress: {
    address1: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    email: string;
  };
  primaryContact: {
    name: string;
    phone: string;
    email: string;
  };
  accountingSystemName: string;
  active: boolean;
  customerNote: string;
  createdBy?: string;
  createdOn?: Date;
  modifiedBy?: string;
  modifiedOn?: Date;
}
