import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CustomerNotifs } from '../customer-notifs.model';
import { CustomerNotifsService } from '../customer-notifs.service';

@Component({
  selector: 'app-customer-notifs-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrls: ['../../styles/list.css'],
  templateUrl: './customer-notifs-list.html'
})
export class CustomerNotifsListComponent implements OnInit {
  customerNotifs: CustomerNotifs[] = [];
  private allCustomerNotifs: CustomerNotifs[] = [];
  filterText = '';

  constructor(private customerNotifsService: CustomerNotifsService) { }

  ngOnInit(): void {
    this.customerNotifsService.getCustomerNotifs().subscribe({
      next: cnotifs => {
        this.allCustomerNotifs = cnotifs || [];
      },
      error: err => console.error('Error fetching customer notifs:', err)
    });
  }

  onFilterChange(query: string) {
    this.filterText = query || '';
    this.applyFilters();
  }

  private applyFilters() {
    const q = this.filterText.toLowerCase().trim();

    this.customerNotifs = this.allCustomerNotifs.filter(cnotif => {
      const fields = [
        cnotif.customerId,
        cnotif.status,
        cnotif.serviceType,
        cnotif.serviceClass,
        cnotif.email
      ];
      const matchesQuery = !q || fields.some(f => !!f && String(f).toLowerCase().includes(q));
      return matchesQuery;
    });
  }

  clearFilter() {
    this.filterText = '';
    this.applyFilters();
  }

  onDelete(id: number) {
    if (!Number.isFinite(id) || id <= 0) return;
    if (!confirm(`Delete customer notif #${id}?`)) return;

    this.customerNotifsService.deleteCustomerNotif(id).subscribe({
      next: () => {
        this.customerNotifs = this.customerNotifs.filter(cnotif => cnotif.rowId !== id);
      },
      error: (err) => {
        console.error('Error deleting customer notif:', err)
        alert('Failed to delete customer notif. Please try again.');
      }
    });
  }
}
