import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CustomerStatusMessage } from './status-messages.model';

@Injectable({ providedIn: 'root' })
export class CustomerStatusMessageService {
  private apiUrl = 'http://localhost:3000/status-messages';

  constructor(private http: HttpClient) {}

/* Fetch all CSMs from the backend */
getCSMs(): Observable<CustomerStatusMessage[]> {
  return this.http.get<CustomerStatusMessage[]>(this.apiUrl);
}

/* Fetch a single CSM by ID */
getCSM(id: number): Observable<CustomerStatusMessage> {
  return this.http.get<CustomerStatusMessage>(`${this.apiUrl}/${id}`);
}

/* Add a new CSM */
addCSM(csm: CustomerStatusMessage): Observable<CustomerStatusMessage> {
  return this.http.post<CustomerStatusMessage>(this.apiUrl, csm);
}

/* Update an existing CSM */
updateCSM(csm: CustomerStatusMessage): Observable<CustomerStatusMessage> {
  return this.http.put<CustomerStatusMessage>(`${this.apiUrl}/${csm.rowId}`, csm);
}

/* Delete a CSM by ID */
deleteCSM(id: number): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/${id}`);
}
}