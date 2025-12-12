import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Office } from './offices.model';

@Injectable({ providedIn: 'root' })
export class OfficesService {
  private apiUrl = 'http://localhost:3000/offices';

  constructor(private http: HttpClient) {}

/* Fetch all offices from the backend */
getOffices(): Observable<Office[]> {
  return this.http.get<Office[]>(this.apiUrl);
}

/* Fetch a single office by ID */
getOffice(id: number): Observable<Office> {
  return this.http.get<Office>(`${this.apiUrl}/${id}`);
}

/* Add a new office */
addOffice(office: Office): Observable<Office> {
  return this.http.post<Office>(this.apiUrl, office);
}

/* Update an existing office */
updateOffice(office: Office): Observable<Office> {
  return this.http.put<Office>(`${this.apiUrl}/${office.id}`, office);
}

/* Delete an office by ID */
deleteOffice(id: number): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/${id}`);
}
}