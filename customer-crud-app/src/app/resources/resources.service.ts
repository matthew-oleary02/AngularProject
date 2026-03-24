import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Resources } from './resources.model';

@Injectable({ providedIn: 'root' })
export class ResourcesService {
  private apiUrl = 'http://localhost:3000/resources';

  constructor(private http: HttpClient) {}

/* Fetch all resources from the backend */
getResources(): Observable<Resources[]> {
  return this.http.get<Resources[]>(this.apiUrl);
}

/* Fetch a single resource by ID */
getResource(id: number): Observable<Resources> {
  return this.http.get<Resources>(`${this.apiUrl}/${id}`);
}

/* Add a new resource */
addResources(vehicle: Resources): Observable<Resources> {
  return this.http.post<Resources>(this.apiUrl, vehicle);
}

/* Update an existing resource */
updateResources(vehicle: Resources): Observable<Resources> {
  return this.http.put<Resources>(`${this.apiUrl}/${vehicle.rowId}`, vehicle);
}

/* Delete a resource by ID */
deleteResources(id: number): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/${id}`);
}
}