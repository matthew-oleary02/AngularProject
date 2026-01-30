// customer-crud-app/src/app/customers/customer-rates.model.ts

export interface CustomerRates {
    rowId: number;
    customer: string;
    trade: string;
    rateType: string;
    state: string;
    rate: string;
    createdBy: string;
    createdOn: string;
    modifiedBy: string;
    modifiedOn: string;
}