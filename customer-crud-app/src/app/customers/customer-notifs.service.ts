import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CustomerNotifs } from './customer-notifs.model';

// Handles CRUD operations for CustomerNotifs API endpoints
@Injectable({ providedIn: 'root' })
export class CustomerNotifsService {
  private apiUrl = 'http://localhost:3000/customer-notifs';

  constructor(private http: HttpClient) { }

  /* Fetch all CustomerNotifs records from the backend */
  getCustomerNotifs(): Observable<CustomerNotifs[]> {
    return this.http.get<CustomerNotifs[]>(this.apiUrl);
  }

  /* Fetch a single CustomerNotifs record by ID */
  getCustomerNotif(id: number): Observable<CustomerNotifs> {
    return this.http.get<CustomerNotifs>(`${this.apiUrl}/${id}`);
  }

  /* Create a new CustomerNotifs record */
  addCustomerNotif(cnotif: CustomerNotifs): Observable<CustomerNotifs> {
    return this.http.post<CustomerNotifs>(this.apiUrl, cnotif);
  }

  /* Update an existing CustomerNotifs record */
  updateCustomerNotif(cnotif: CustomerNotifs): Observable<CustomerNotifs> {
    return this.http.put<CustomerNotifs>(`${this.apiUrl}/${cnotif.rowId}`, cnotif);
  }

  /* Delete a CustomerNotifs record by ID */
  deleteCustomerNotif(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
