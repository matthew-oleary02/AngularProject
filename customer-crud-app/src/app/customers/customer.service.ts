/*
import { Injectable } from '@angular/core';
import { Customer } from './customer.model';
import { BehaviorSubject, Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private customers: Customer[] = [];
  private customers$ = new BehaviorSubject<Customer[]>(this.customers);

  getCustomers(): Observable<Customer[]> {
    return this.customers$.asObservable();
  }

  getCustomer(id: number): Observable<Customer | undefined> {
    return of(this.customers.find(c => c.rowId === id));
  }

  addCustomer(customer: Customer) {
    customer.rowId = this.customers.length + 1;
    customer.createdOn = new Date();
    this.customers.push(customer);
    this.customers$.next(this.customers);
  }

  updateCustomer(customer: Customer) {
    const index = this.customers.findIndex(c => c.rowId === customer.rowId);
    if(index >= 0){
      customer.modifiedOn = new Date();
      this.customers[index] = customer;
      this.customers$.next(this.customers);
    }
  }

  deleteCustomer(id: number) {
    this.customers = this.customers.filter(c => c.rowId !== id);
    this.customers$.next(this.customers);
  }
}
*/

/* customer.service.ts - Angular service for managing customer data via HTTP requests */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Customer } from './customer.model';
import { Location } from './location.model'

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private apiUrl = 'http://localhost:3000/customers';

  constructor(private http: HttpClient) {}

/* Fetch all customers from the backend */
getCustomers(): Observable<Customer[]> {
  return this.http.get<Customer[]>(this.apiUrl);
}

/* Fetch a single customer by ID */
getCustomer(id: number): Observable<Customer> {
  return this.http.get<Customer>(`${this.apiUrl}/${id}`);
}

/* Add a new customer */
addCustomer(customer: Customer): Observable<Customer> {
  return this.http.post<Customer>(this.apiUrl, customer);
}

/* Update an existing customer */
updateCustomer(customer: Customer): Observable<Customer> {
  return this.http.put<Customer>(`${this.apiUrl}/${customer.rowId}`, customer);
}

/* Fetch location list per customer */
getLocationList(customerId: number): Observable<Location[]> {
  return this.http.get<Location[]>(`${this.apiUrl}/${customerId}/locations`);
}

/* Fetch status messages per customer */
getStatusMessages(customerId: number): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/${customerId}/status-messages`);
}

/* Fetch customer CAMs per customer */
getCustomerCams(customerId: number): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/${customerId}/customer-cams`);
}

/* Delete a customer by ID */
deleteCustomer(id: number): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/${id}`);
}
}