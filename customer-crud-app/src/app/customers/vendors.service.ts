import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Vendor } from './vendors.model';

@Injectable({ providedIn: 'root' })
export class VendorService {
  private apiUrl = 'http://localhost:3000/vendors';

  constructor(private http: HttpClient) {}

/* Fetch all vendors from the backend */
getVendors(): Observable<Vendor[]> {
  return this.http.get<Vendor[]>(this.apiUrl);
}

/* Fetch a single vendor by ID */
getVendor(id: number): Observable<Vendor> {
  return this.http.get<Vendor>(`${this.apiUrl}/${id}`);
}

/* Add a new vendor */
addVendor(vendor: Vendor): Observable<Vendor> {
  return this.http.post<Vendor>(this.apiUrl, vendor);
}

/* Update an existing vendor */
updateVendor(vendor: Vendor): Observable<Vendor> {
  return this.http.put<Vendor>(`${this.apiUrl}/${vendor.rowId}`, vendor);
}

/* Delete a vendor by ID */
deleteVendor(id: number): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/${id}`);
}
}