import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CustomerRates } from './customer-rates.model'

@Injectable({ providedIn: 'root' })
export class CustomerRatesService {

    // Base URL for the Customer Rates API
    private apiUrl = 'http://localhost:3000/customer-rates';
    
    constructor(private http: HttpClient) {}

    /* Fetch all Customer Rates records from the backend */
    getCustomerRates(): Observable<CustomerRates[]> {
        return this.http.get<CustomerRates[]>(this.apiUrl);
    }

    /* Fetch a single Customer Rates record by ID */
    getCustomerRate(id: number): Observable<CustomerRates> {
        return this.http.get<CustomerRates>(`${this.apiUrl}/${id}`);
    }

    /* Create a new Customer Rates record */
    addCustomerRate(cr: CustomerRates): Observable<CustomerRates> {
        return this.http.post<CustomerRates>(this.apiUrl, cr);
    }

    /* Update an existing Customer Rates record */
    updateCustomerRate(cr: CustomerRates): Observable<CustomerRates> {
        return this.http.put<CustomerRates>(`${this.apiUrl}/${cr.rowId}`, cr);
    }

    /* Delete a Customer Rates record by ID */
    deleteCustomerRate(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
