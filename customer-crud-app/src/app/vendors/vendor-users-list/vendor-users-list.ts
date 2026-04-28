import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VendorUsers } from '../models/vendor-users.model';
import { VendorUsersService } from '../services/vendor-users.service';

@Component({
  selector: 'app-vendor-users-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vendor-users-list.html',
  styleUrls: ['../../styles/list.css'],
})
export class VendorUsersListComponent implements OnInit {
  @Input() vendorId: number | null = null;
  /* List of vendor users to display */
  vendorUsers: VendorUsers[] = [];
  /* Full list of vendor users from the server */
  private allVendorUsers: VendorUsers[] = [];
  filterText = '';
  activeFilter: boolean | null = true;

  constructor(private vendorUsersService: VendorUsersService) {}

  /* Load all vendor users on component initialization */
  ngOnInit() {
    this.vendorUsersService.getVendorUsers().subscribe({
      next: users => {
        this.allVendorUsers = users || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching vendor users:', err)
    });
  }

  /* Filter vendor users based on user input */
  onFilterChange(query: string) {
    this.filterText = query || '';
    this.applyFilters();
  }

  /* Called when the Active checkbox is toggled */
  onActiveToggle(checked: boolean) {
    this.activeFilter = checked;
    this.applyFilters();
  }

  /* Central filter logic: text toggle */
  private applyFilters() {
    const q = this.filterText.toLowerCase().trim();

    this.vendorUsers = this.allVendorUsers.filter(vu => {
      // Filter by vendorId if provided
      const matchesVendor = this.vendorId === null ? true : (vu.rowId === this.vendorId); // Assuming rowId is vendorId for this entity or similar
      
      const matchesActive = this.activeFilter === null ? true : (vu.active === this.activeFilter);

      // text search across multiple fields
      const fields = [
        vu.vendor,
        vu.username,
        vu.email,
        vu.phone,
        vu.trade,
        vu.active,
      ];
      const matchesQuery = !q || fields.some(f => !!f && String(f).toLowerCase().includes(q));

      return matchesActive && matchesQuery; // && matchesVendor
    });
  }

  /* Clear the filter input and reset vendor users list */
  clearFilter() {
    this.filterText = '';
    this.applyFilters();
  }

  /* Delete a vendor user after confirmation */
  onDelete(id: number) {
    if (!Number.isFinite(id) || id <= 0) return;
    if (!confirm(`Delete vendor user #${id}?`)) return;

    this.vendorUsersService.deleteVendorUser(id).subscribe({
      next: () => {
        this.vendorUsers = this.vendorUsers.filter(vu => vu.rowId !== id);
      },
      error: (err) => {
        console.error('Error deleting vendor user:', err)
        alert('Failed to delete vendor user. Please try again.');
      }
    });
  }
}
