// Domain model for CustomerNotifs entity
export interface CustomerNotifs {
  rowId: number;
  customerId: string;
  status: string;
  serviceType: string;
  serviceClass: string;
  email: string;
  createdOn: Date;
  createdBy: string;
  modifiedOn: Date;
  modifiedBy: string;
}