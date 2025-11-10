/* customer-list.ts - Angular component for displaying and managing customer list */

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
  activeFilter: boolean | null = true;

  constructor(private customerService: CustomerService) {}

  /* Load all customers on component initialization */
  ngOnInit() {
    this.customerService.getCustomers().subscribe({
      next: c => {
        this.allCustomers = c || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching customers:', err)
    });
  }

  /* Filter customers based on user input */
  onFilterChange(query: string) {
    this.filterText = query || '';
    this.applyFilters();
  }

  /* Called when the Active checkbox is toggled */
  onActiveToggle(checked: boolean) {
    // set activeFilter to boolean (true= active, false= inactive)
    this.activeFilter = checked;
    this.applyFilters();
  }

  /* Central filter logic: text + active toggle */
  private applyFilters() {
    const q = this.filterText.toLowerCase().trim();

    this.customers = this.allCustomers.filter(c => {
      // active filter: if activeFilter is null, don't filter by active; otherwise match boolean
      const matchesActive = this.activeFilter === null ? true : (c.active === this.activeFilter);

      // text search across multiple fields
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
      const matchesQuery = !q || fields.some(f => !!f && String(f).toLowerCase().includes(q));

      return matchesActive && matchesQuery;
    });
  }

  /* Clear the filter input and reset customer list */
  clearFilter() {
    this.filterText = '';
    this.applyFilters();
  }

  /* Delete a customer after confirmation */
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