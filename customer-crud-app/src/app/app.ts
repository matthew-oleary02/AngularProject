/*

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<h1>Customer CRUD App</h1><router-outlet></router-outlet>`
})
export class AppComponent {}
*/

import { Component, OnInit } from '@angular/core';
import { ApiService } from './api';
import { Customer } from './customers/customer.model'; // Adjust path if needed

@Component({
  selector: 'app-root',
  template: `
    <ul>
      <li *ngFor="let customer of customers">
        {{ customer.customerName }} - {{ customer.billingAddress.email }}
      </li>
    </ul>
  `
})
export class AppComponent implements OnInit {
  customers: Customer[] = []; // ✅ Correct type

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getCustomers().subscribe((data: Customer[]) => {
      this.customers = data;
    });
  }
}