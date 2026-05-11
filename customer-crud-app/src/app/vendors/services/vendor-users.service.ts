import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { VendorUsers } from '../models/vendor-users.model';

@Injectable({ providedIn: 'root' })
export class VendorUsersService {
  private apiUrl = 'http://localhost:3000/vendor-users';

  constructor(private http: HttpClient) {}

  /* Fetch all vendor users from the backend */
  getVendorUsers(): Observable<VendorUsers[]> {
    return this.http.get<VendorUsers[]>(this.apiUrl);
  }

  /* Fetch users for a specific vendor */
  getUsersByVendor(vendorId: number): Observable<VendorUsers[]> {
    return this.http.get<VendorUsers[]>(`http://localhost:3000/vendors/${vendorId}/users`);
  }

  /* Fetch a single vendor user by ID */
  getVendorUser(id: number): Observable<VendorUsers> {
    return this.http.get<VendorUsers>(`${this.apiUrl}/${id}`);
  }

  /* Add a new vendor user */
  addVendorUser(vendorUser: VendorUsers): Observable<VendorUsers> {
    return this.http.post<VendorUsers>(this.apiUrl, vendorUser);
  }

  /* Update an existing vendor user */
  updateVendorUser(vendorUser: VendorUsers): Observable<VendorUsers> {
    return this.http.put<VendorUsers>(`${this.apiUrl}/${vendorUser.rowId}`, vendorUser);
  }

  /* Delete a vendor user by ID */
  deleteVendorUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
