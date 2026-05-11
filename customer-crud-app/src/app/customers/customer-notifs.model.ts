// Domain model for CustomerNotifs entity
export interface CustomerNotifs {
  rowId: number;
  customerId: string;
  customer: string;
  status: string;
  serviceType: string;
  serviceClass: string;
  email: string;
  createdOn: Date;
  createdBy: string;
  enteredBy: string;
  dateEntered: Date;
  modifiedOn: Date;
  modifiedBy: string;
}