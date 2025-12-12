import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VendorService } from '../vendors.service';
import { Vendor } from '../vendors.model';

@Component({
  selector: 'app-vendors-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vendors.html',
  styleUrls: ['./vendors.css']
})
export class VendorListComponent implements OnInit {
  /* List of vendors to display */
  vendors: Vendor[] = [];
  /* Full list of vendors from the server */
  private allVendors: Vendor[] = [];
  filterText = '';
  activeFilter: boolean | null = true;

  constructor(private vendorService: VendorService) {}

  /* Load all vendors on component initialization */
  ngOnInit() {
    this.vendorService.getVendors().subscribe({
      next: v => {
        this.allVendors = v || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching vendors:', err)
    });
  }

  /* Filter vendors based on user input */
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

    this.vendors = this.allVendors.filter(v => {
      // active filter: if activeFilter is null, don't filter by active; otherwise match boolean
      //const matchesActive = this.activeFilter === null ? true : (v.active === this.activeFilter);

      // text search across multiple fields
      const fields = [
        v.vendorName,
        v.billingAddress?.address1,
        v.billingAddress?.address2,
        v.billingAddress?.city,
        v.billingAddress?.state,
        v.billingAddress?.zip,
        v.primaryContact?.phone,
        v.primaryContact?.email,
        v.status,
        v.vendorType
      ];
      const matchesQuery = !q || fields.some(f => !!f && String(f).toLowerCase().includes(q));

      return /*matchesActive &&*/ matchesQuery;
    });
  }

  /* Clear the filter input and reset vendor list */
  clearFilter() {
    this.filterText = '';
    this.applyFilters();
  }

  /* Delete a vendor after confirmation */
  onDelete(id: number) {
    if (!Number.isFinite(id) || id <= 0) return;
    if (!confirm(`Delete vendor #${id}?`)) return;

    this.vendorService.deleteVendor(id).subscribe({
      next: () => {
        this.vendors = this.vendors.filter(c => c.rowId !== id);
      },
      error: (err) => {
        console.error('Error deleting vendor:', err)
        alert('Failed to delete vendor. Please try again.');
      }
    });
  }
}