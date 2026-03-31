export interface TabletUser {
    rowId: number;
    resourceId: number; // Link to Resources rowId
    fname?: string; // Optional for compatibility
    lname?: string; // Optional for compatibility
    pin: string;
    createdOn: Date;
    createdBy: string;
    modifiedOn: Date;
    modifiedBy: string;
}