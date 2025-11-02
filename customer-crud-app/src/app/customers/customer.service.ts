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

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Customer } from './customer.model';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private apiUrl = 'http://localhost:3000/customers'; // Update if your backend runs on a different port

  constructor(private http: HttpClient) {}

getCustomers(): Observable<Customer[]> {
  return this.http.get<Customer[]>(this.apiUrl);
}

getCustomer(id: number): Observable<Customer> {
  return this.http.get<Customer>(`${this.apiUrl}/${id}`);
}

addCustomer(customer: Customer): Observable<Customer> {
  return this.http.post<Customer>(this.apiUrl, customer);
}

updateCustomer(customer: Customer): Observable<Customer> {
  return this.http.put<Customer>(`${this.apiUrl}/${customer.rowId}`, customer);
}

deleteCustomer(id: number): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/${id}`);
}
}