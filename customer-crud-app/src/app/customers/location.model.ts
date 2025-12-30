/* location.model.ts - Defines the Location interface */

export interface Location {
  rowId: number;
  customer: string;
  storeNumber: string;
  primaryContact: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  country: string;
  siteNote: string;
  active: boolean;
  enteredBy?: string;
  dateEntered?: Date;
  modifiedBy?: string;
  modifiedOn?: Date;
}
