export interface InvoiceItem {
    rowId: number;
    serviceRequestId: number;
    category: string;
    description: string;
    total: number;
    saleTaxTotal: number;
    quantity: number;
    rate: number;
    createdOn: Date;
    createdBy: string;
    modifiedOn: Date;
    modifiedBy: string;
}