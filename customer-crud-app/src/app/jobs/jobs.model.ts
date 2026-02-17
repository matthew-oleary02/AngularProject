export interface Jobs {
    rowId: number;
    jobNumber: string;
    customer: string;
    location: string;
    clientTrackingNumber: string;
    serviceType: string;
    jobStatus: string;
    trade: string;
    vendor: string;
    jobOwner: string;
    dateReceived: Date;
    state: string;
    eta: Date;
    caller: string;
    nte: number;
    vendorNTE: number;
    quote: number;
    jobNote: string;
    active: boolean;
    enteredBy?: string;
    dateEntered?: Date;
    modifiedBy?: string;
    modifiedOn?: Date;
}