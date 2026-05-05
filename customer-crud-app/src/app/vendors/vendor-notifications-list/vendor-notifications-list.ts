import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VendorNotifications } from '../models/vendor-notifications.model';
import { VendorNotificationsService } from '../services/vendor-notifications.service';

@Component({
  selector: 'app-vendor-notifications-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrls: ['../../styles/list.css'],
  templateUrl: './vendor-notifications-list.html'
})
export class VendorNotificationsListComponent implements OnInit {
  vendorNotifications: VendorNotifications[] = [];
  private allVendorNotifications: VendorNotifications[] = [];
  filterText = '';

  constructor(private vendorNotificationsService: VendorNotificationsService) { }

  ngOnInit(): void {
    this.vendorNotificationsService.getVendorNotifications().subscribe({
      next: vnotifs => {
        this.allVendorNotifications = vnotifs || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching vendor notifications:', err)
    });
  }

  onFilterChange(query: string) {
    this.filterText = query || '';
    this.applyFilters();
  }

  private applyFilters() {
    const q = this.filterText.toLowerCase().trim();

    this.vendorNotifications = this.allVendorNotifications.filter(vnotif => {
      const fields = [
        vnotif.vendorId,
        vnotif.vendor,
        vnotif.status,
        vnotif.serviceType,
        vnotif.serviceClass,
        vnotif.email
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
    if (!confirm(`Delete vendor notification #${id}?`)) return;

    this.vendorNotificationsService.deleteVendorNotification(id).subscribe({
      next: () => {
        this.allVendorNotifications = this.allVendorNotifications.filter(vnotif => vnotif.rowId !== id);
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error deleting vendor notification:', err)
        alert('Failed to delete vendor notification. Please try again.');
      }
    });
  }
}
