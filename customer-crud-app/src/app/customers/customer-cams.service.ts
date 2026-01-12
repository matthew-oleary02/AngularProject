import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CustomerCAMs } from './customer-cams.model';

@Injectable({ providedIn: 'root' })
export class CustomerCAMsService {
  private apiUrl = 'http://localhost:3000/customer-cams';

  constructor(private http: HttpClient) {}

/* Fetch all CCs from the backend */
getCCs(): Observable<CustomerCAMs[]> {
  return this.http.get<CustomerCAMs[]>(this.apiUrl);
}

/* Fetch a single CC by ID */
getCC(id: number): Observable<CustomerCAMs> {
  return this.http.get<CustomerCAMs>(`${this.apiUrl}/${id}`);
}

/* Add a new CC */
addCC(cc: CustomerCAMs): Observable<CustomerCAMs> {
  return this.http.post<CustomerCAMs>(this.apiUrl, cc);
}

/* Update an existing CC */
updateCC(cc: CustomerCAMs): Observable<CustomerCAMs> {
  return this.http.put<CustomerCAMs>(`${this.apiUrl}/${cc.rowId}`, cc);
}

/* Delete a CC by ID */
deleteCC(id: number): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/${id}`);
}
}