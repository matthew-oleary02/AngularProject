import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Equipment } from './equipment.model';

@Injectable({ providedIn: 'root' })
export class EquipmentService {
  private apiUrl = 'http://localhost:3000/equipment';
    constructor(private http: HttpClient) {}

    /* Fetch all equipment from the backend */
    getEquipment(): Observable<Equipment[]> {
        return this.http.get<Equipment[]>(this.apiUrl);
    }

    /* Fetch a single equipment by ID */
    getEquipmentById(id: number): Observable<Equipment> {
        return this.http.get<Equipment>(`${this.apiUrl}/${id}`);
    }

    /* Add new equipment */
    addEquipment(equipment: Equipment): Observable<Equipment> {
        return this.http.post<Equipment>(this.apiUrl, equipment);
    }

    /* Update existing equipment */
    updateEquipment(equipment: Equipment): Observable<Equipment> {
        return this.http.put<Equipment>(`${this.apiUrl}/${equipment.rowId}`, equipment);
    }

    /* Delete equipment by ID */
    deleteEquipment(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}