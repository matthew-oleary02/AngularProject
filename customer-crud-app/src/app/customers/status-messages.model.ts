export interface CustomerStatusMessage {
    rowId: number;
    customer: string;
    status: string;
    message: string;
    active: boolean;
    enteredBy?: string;
    dateEntered?: Date;
    modifiedBy?: string;
    modifiedOn?: Date;
}