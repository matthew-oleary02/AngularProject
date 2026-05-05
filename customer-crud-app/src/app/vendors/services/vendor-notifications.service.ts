import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { VendorNotifications } from '../models/vendor-notifications.model';

// Handles CRUD operations for VendorNotifications API endpoints
@Injectable({ providedIn: 'root' })
export class VendorNotificationsService {
  private apiUrl = 'http://localhost:3000/vendor-notifications';

  constructor(private http: HttpClient) { }

  /* Fetch all VendorNotifications records from the backend */
  getVendorNotifications(): Observable<VendorNotifications[]> {
    return this.http.get<VendorNotifications[]>(this.apiUrl);
  }

  /* Fetch a single VendorNotifications record by ID */
  getVendorNotification(id: number): Observable<VendorNotifications> {
    return this.http.get<VendorNotifications>(`${this.apiUrl}/${id}`);
  }

  /* Create a new VendorNotifications record */
  addVendorNotification(vnotif: VendorNotifications): Observable<VendorNotifications> {
    return this.http.post<VendorNotifications>(this.apiUrl, vnotif);
  }

  /* Update an existing VendorNotifications record */
  updateVendorNotification(vnotif: VendorNotifications): Observable<VendorNotifications> {
    return this.http.put<VendorNotifications>(`${this.apiUrl}/${vnotif.rowId}`, vnotif);
  }

  /* Delete a VendorNotifications record by ID */
  deleteVendorNotification(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
