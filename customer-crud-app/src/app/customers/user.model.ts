export interface Users {
  id: number;
  username: string;
  password: string;
  email: string;
  role: string;
  active: boolean;
  createdOn?: Date;
  modifiedOn?: Date;
}