import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CustomerService } from '../customer.service';
import { Customer } from '../customer.model';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './customer-list.html',
  styleUrls: ['./customer-list.css']
})
export class CustomerListComponent implements OnInit {
  customers: Customer[] = [];

  constructor(private customerService: CustomerService) {}

  ngOnInit() {
    this.customerService.getCustomers().subscribe({
      next: c => this.customers = c,
      error: err => console.error('Error fetching customers:', err)
    });
  }

  onDelete(id: number) {
    if (!Number.isFinite(id) || id <= 0) return;
    if (!confirm(`Delete customer #${id}?`)) return;

    this.customerService.deleteCustomer(id).subscribe(() => {
      this.customerService.getCustomers().subscribe(c => this.customers = c);
    });
  }
}