import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Vehicles } from './vehicles.model';

@Injectable({ providedIn: 'root' })
export class VehiclesService {
  private apiUrl = 'http://localhost:3000/vehicles';

  constructor(private http: HttpClient) {}

/* Fetch all vehicle from the backend */
getVehicles(): Observable<Vehicles[]> {
  return this.http.get<Vehicles[]>(this.apiUrl);
}

/* Fetch a single vehicle by ID */
getVehicle(id: number): Observable<Vehicles> {
  return this.http.get<Vehicles>(`${this.apiUrl}/${id}`);
}

/* Add a new vehicle */
addVehicles(vehicle: Vehicles): Observable<Vehicles> {
  return this.http.post<Vehicles>(this.apiUrl, vehicle);
}

/* Update an existing vehicle */
updateVehicles(vehicle: Vehicles): Observable<Vehicles> {
  return this.http.put<Vehicles>(`${this.apiUrl}/${vehicle.rowId}`, vehicle);
}

/* Delete an vehicle by ID */
deleteVehicles(id: number): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/${id}`);
}
}