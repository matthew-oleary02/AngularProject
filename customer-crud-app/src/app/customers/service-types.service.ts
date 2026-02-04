import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ServiceTypes } from './service-types.model';

@Injectable({ providedIn: 'root' })
export class ServiceTypesService {
    private apiUrl = 'http://localhost:3000/service-types';

    constructor(private http: HttpClient) {}
    /* Fetch all Service Types records from the backend */
    getServiceTypes(): Observable<ServiceTypes[]> {
        return this.http.get<ServiceTypes[]>(this.apiUrl);
    }

    /* Fetch a single Service Types record by ID */
    getServiceType(id: number): Observable<ServiceTypes> {
        return this.http.get<ServiceTypes>(`${this.apiUrl}/${id}`);
    }

    /* Create a new Service Types record */
    addServiceType(serviceType: ServiceTypes): Observable<ServiceTypes> {
        return this.http.post<ServiceTypes>(this.apiUrl, serviceType);
    }

    /* Update an existing Service Types record */
    updateServiceType(serviceType: ServiceTypes): Observable<ServiceTypes> {
        return this.http.put<ServiceTypes>(`${this.apiUrl}/${serviceType.rowId}`, serviceType);
    }

    /* Delete a Service Types record by ID */
    deleteServiceType(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}