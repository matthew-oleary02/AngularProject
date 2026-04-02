import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ResourceProductivity } from './resource-productivity.model';

@Injectable({ providedIn: 'root' })
export class ResourceProductivityService {
    private apiUrl = 'http://localhost:3000/resource-productivity';

    constructor(private http: HttpClient) { }

    /* Fetch all resource productivity records from the backend */
    getResourceProductivity(): Observable<ResourceProductivity[]> {
        return this.http.get<ResourceProductivity[]>(this.apiUrl);
    }

    /* Fetch a single resource productivity record by ID */
    getResourceProductivityById(id: number): Observable<ResourceProductivity> {
        return this.http.get<ResourceProductivity>(`${this.apiUrl}/${id}`);
    }

    /* Add a new resource productivity record */
    addResourceProductivity(record: ResourceProductivity): Observable<ResourceProductivity> {
        return this.http.post<ResourceProductivity>(this.apiUrl, record);
    }

    /* Update an existing resource productivity record */
    updateResourceProductivity(record: ResourceProductivity): Observable<ResourceProductivity> {
        return this.http.put<ResourceProductivity>(`${this.apiUrl}/${record.rowId}`, record);
    }

    /* Delete a resource productivity record by ID */
    deleteResourceProductivity(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
