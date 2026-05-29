export interface JobNote {
    rowId: number;
    job: string;
    status: string;
    message: string;
    active: boolean;
    enteredBy?: string;
    dateEntered?: Date;
    modifiedBy?: string;
    modifiedOn?: Date;
}
