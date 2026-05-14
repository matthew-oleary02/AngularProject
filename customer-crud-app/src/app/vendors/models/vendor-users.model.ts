export interface VendorUsers {
    rowId: number;
    vendorName: string;
    username: string;
    email: string;
    phone: string;
    trade: string;
    active: boolean;
    createdBy?: string;
    createdOn?: Date;
    modifiedBy?: string;
    modifiedOn?: Date;
}
