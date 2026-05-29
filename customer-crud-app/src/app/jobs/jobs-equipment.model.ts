export interface JobsEquipment {
    rowId: number;
    job: string;
    location: string;
    entryStatus: string;
    manufacturer: string;
    model: string;
    serialNumber: string;
    tonnage: string;
    age: string;
    condition: string;
    typeOfUnit: string;
    dateLoaded?: Date;
    enteredBy?: string;
    dateEntered?: Date;
    modifiedBy?: string;
    modifiedOn?: Date;
}
