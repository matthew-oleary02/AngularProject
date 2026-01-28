import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CustomerETA } from './customer-eta.model'

@Injectable({ providedIn: 'root' })
export class CustomerETAService {
    private apiUrl = 'http://localhost:3000/customer-eta';

    constructor(private http: HttpClient) {}

    /* Fetch all Customer ETA records from the backend */
    getCustomerEtas(): Observable<CustomerETA[]> {
        return this.http.get<CustomerETA[]>(this.apiUrl);
    }

    /* Fetch a single Customer ETA record by ID */
    getCustomerEta(id: number): Observable<CustomerETA> {
        return this.http.get<CustomerETA>(`${this.apiUrl}/${id}`);
    }

    /* Create a new Customer ETA record */
    addCustomerEta(ceta: CustomerETA): Observable<CustomerETA> {
        return this.http.post<CustomerETA>(this.apiUrl, ceta);
    }

    /* Update an existing Customer ETA record */
    updateCustomerEta(ceta: CustomerETA): Observable<CustomerETA> {
        return this.http.put<CustomerETA>(`${this.apiUrl}/${ceta.rowId}`, ceta);
    }

    /* Delete a Customer ETA record by ID */
    deleteCustomerEta(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}