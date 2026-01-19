import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CustomerNTE } from './customer-nte.model'

@Injectable({ providedIn: 'root' })
export class CustomerNTEService {
    private apiUrl = 'http://localhost:3000/customer-nte';

    constructor(private http: HttpClient) {}

    /* Fetch all Customer NTE records from the backend */
    getCustomerNtes(): Observable<CustomerNTE[]> {
        return this.http.get<CustomerNTE[]>(this.apiUrl);
    }

    /* Fetch a single Customer NTE record by ID */
    getCustomerNte(id: number): Observable<CustomerNTE> {
        return this.http.get<CustomerNTE>(`${this.apiUrl}/${id}`);
    }

    /* Create a new Customer NTE record */
    addCustomerNte(cn: CustomerNTE): Observable<CustomerNTE> {
        return this.http.post<CustomerNTE>(this.apiUrl, cn);
    }

    /* Update an existing Customer NTE record */
    updateCustomerNte(cn: CustomerNTE): Observable<CustomerNTE> {
        return this.http.put<CustomerNTE>(`${this.apiUrl}/${cn.rowId}`, cn);
    }

    /* Delete a Customer NTE record by ID */
    deleteCustomerNte(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}