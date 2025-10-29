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
