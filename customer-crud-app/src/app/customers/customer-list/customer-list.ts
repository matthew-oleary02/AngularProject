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
  private allCustomers: Customer[] = [];
  filterText = '';

  constructor(private customerService: CustomerService) {}

  ngOnInit() {
    this.customerService.getCustomers().subscribe({
      next: c => {
        this.allCustomers = c || [];
        this.customers = [...this.allCustomers];
      },
      error: err => console.error('Error fetching customers:', err)
    });
  }

  onFilterChange(query: string) {
    this.filterText = query || '';
    const q = this.filterText.toLowerCase().trim();
    if (!q) {
      this.customers = [...this.allCustomers];
      return;
    }

    this.customers = this.allCustomers.filter(c => {
      const fields = [
        c.customerName,
        c.billingAddress?.address1,
        c.billingAddress?.address2,
        c.billingAddress?.city,
        c.billingAddress?.state,
        c.billingAddress?.zip,
        c.billingAddress?.country,
        c.primaryContact?.name,
        c.primaryContact?.phone,
        c.primaryContact?.email,
        c.customerNote
      ];
      return fields.some(f => !!f && String(f).toLowerCase().includes(q));
    });
  }

  clearFilter() {
    this.filterText = '';
    this.customers = [...this.allCustomers];
  }

  onDelete(id: number) {
    if (!Number.isFinite(id) || id <= 0) return;
    if (!confirm(`Delete customer #${id}?`)) return;

    this.customerService.deleteCustomer(id).subscribe({
      next: () => {
        this.customers = this.customers.filter(c => c.rowId !== id);
      },
      error: (err) => {
        console.error('Error deleting customer:', err)
        alert('Failed to delete customer. Please try again.');
      }
    });
  }
}