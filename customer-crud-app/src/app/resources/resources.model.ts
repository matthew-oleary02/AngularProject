export interface Resources {
    rowId: number;
    fname: string;
    lname: string;
    contactInfo: {
        title: string;
        department: string;
        phone: string;
        cellphone: string;
        email: string;
        address1: string;
        address2: string;
        city: string;
        state: string;
        zipCode: number;
        hireDate: Date;
        termDate: Date;
        leadTech: boolean;
        active: boolean;
    }
    company: string;
    employmentType: string;
    pin: number;
    dob: Date;
    groupName: string;
    createdBy: string;
    createdOn: Date;
    modifiedBy: string;
    modifiedOn: Date;
}