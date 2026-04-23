import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
// Handles CRUD operations for vendor-users API endpoints
export class VendorUsersService {
  // Base API URL
  private apiUrl = '';

  constructor() {}

  // CRUD method signatures
  getAll() {}
  getById(id: string) {}
  create(data: any) {}
  update(id: string, data: any) {}
  delete(id: string) {}

  // Error handling section
  private handleError(error: any) {
    console.error(error);
  }
}
