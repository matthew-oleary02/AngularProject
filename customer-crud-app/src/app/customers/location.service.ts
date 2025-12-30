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

/* location.service.ts - Angular service for managing location data via HTTP requests */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Location } from './location.model';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private apiUrl = 'http://localhost:3000/locations';

  constructor(private http: HttpClient) {}

/* Fetch all locations from the backend */
getLocations(): Observable<Location[]> {
  return this.http.get<Location[]>(this.apiUrl);
}

/* Fetch a single location by ID */
getLocation(id: number): Observable<Location> {
  return this.http.get<Location>(`${this.apiUrl}/${id}`);
}

/* Add a new location */
addLocation(location: Location): Observable<Location> {
  return this.http.post<Location>(this.apiUrl, location);
}

/* Update an existing location */
updateLocation(location: Location): Observable<Location> {
  return this.http.put<Location>(`${this.apiUrl}/${location.rowId}`, location);
}

/* Delete a location by ID */
deleteLocation(id: number): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/${id}`);
}
}