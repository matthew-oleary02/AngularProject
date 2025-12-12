export interface PurchaseOrder {
    rowId: number;
    purchaseOrder: {
        poNumber: number;
        total: number;
        customer: string;
        vendor: string;
        employee: string;
        description: string;
        cardType: string;
        void: boolean;
        enteredBy?: string;
        dateEntered?: Date;
        modifiedBy?: string;
        modifiedOn?: Date;
    }
}