export interface PurchaseOrder {
    rowId: number;
    poNumber: string;
    total: string;
    customer: string;
    vendor: string;
    employee: string;
    description?: string;
    cardType: string;
    void: boolean;
    enteredBy: string;
    dateEntered: string | Date;
    modifiedBy?: string;
    modifiedOn?: string | Date;
}
