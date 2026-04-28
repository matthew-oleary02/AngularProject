export interface VendorNote {
    rowId: number;
    vendor: string;
    status: string;
    message: string;
    active: boolean;
    enteredBy?: string;
    dateEntered?: Date;
    modifiedBy?: string;
    modifiedOn?: Date;
}
