import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Vendor } from './vendors.model';

@Injectable({ providedIn: 'root' })
export class VendorService {
  private apiUrl = 'http://localhost:3000/vendors';

  constructor(private http: HttpClient) { }

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

  /* Fetch jobs for a specific vendor */
  getJobsByVendor(vendorId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${vendorId}/jobs`);
  }

  /* Fetch rates for a specific vendor */
  getRatesByVendor(vendorId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${vendorId}/rates`);
  }

  /* Fetch notifications for a specific vendor */
  getNotificationsByVendor(vendorId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${vendorId}/notifications`);
  }

  /* Fetch coverage for a specific vendor */
  getCoverageByVendor(vendorId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${vendorId}/coverage`);
  }

  /* Fetch assets for a specific vendor */
  getAssetsByVendor(vendorId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${vendorId}/assets`);
  }

  /* Fetch users for a specific vendor */
  getUsersByVendor(vendorId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${vendorId}/users`);
  }
}