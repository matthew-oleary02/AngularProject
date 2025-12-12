
export interface Users {
  id: number;            // maps to Id
  username: string;      // maps to Username
  passwordHash: string;  // maps to PasswordHash
  role: string;          // maps to Role
  createdOn: Date;       // maps to CreatedOn
  roleId: number;        // maps to RoleId
  email: string;         // maps to Email
  active: boolean;       // maps to Active
  modifiedOn?: Date;     // maps to ModifiedOn
}
