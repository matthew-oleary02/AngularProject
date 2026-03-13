export interface Vehicles {
    rowId: number;
    vehicleCode: string;
    status: boolean;
    gpsType: string;
    statusNote: string;
    vehicleType: string;
    year: number;
    make: string;
    model: string;
    color: string;
    vin: string;
    plate: string;
    state: string;
    manager: string;
    assignedTo: string;
    department: string;
    registration: Date;
    inspection: Date;
    vendorVehicleID: string;
    passType: string;
    passNumber: number;
    createdBy: string;
    createdOn: Date;
    modifiedBy: string;
    modifiedOn: Date;
}