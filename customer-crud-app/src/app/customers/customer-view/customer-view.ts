import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CustomerService } from '../customer.service';
import { Customer } from '../customer.model';
import { Location } from '../location.model';
import { LocationService } from '../location.service';

@Component({
  selector: 'app-customer-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './customer-view.html',
  styleUrls: ['./customer-view.css']
})

export class CustomerViewComponent implements OnInit {
  customer?: Customer;
  locations: Location[] = [];
  /* Full list of locations from the server */
  private allLocations: Location[] = [];
  filterText = '';
  activeFilter: boolean | null = true;
  activeTab: string = 'sites';

  constructor(private customerService: CustomerService,
    private router: Router,
    private route: ActivatedRoute,
    private locationService: LocationService
  ) {}

  /* Load customer details based on route parameter */
  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      console.error('Invalid customer ID', idParam);
    };
    
    /* Fetch customer details from the service */
    this.customerService.getCustomer(id).subscribe({
      next: c => this.customer = c,
      error: err => console.error('Error fetching customers:', err)
    });

    /* Fetch location list for the customer */
    this.customerService.getLocationList(id).subscribe({
      next: loc => {
        this.allLocations = loc || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching locations:', err)
    });
  }


  /* Filter locations based on user input */
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

    this.locations = this.allLocations.filter(loc => {
      // active filter: if activeFilter is null, don't filter by active; otherwise match boolean
      const matchesActive = this.activeFilter === null ? true : (loc.active === this.activeFilter);

      // text search across multiple fields
      const fields = [
        loc.customer,
        loc?.storeNumber,
        loc.siteAddress?.address1,
        loc.siteAddress?.address2,
        loc.siteAddress?.city,
        loc.siteAddress?.state,
        loc.siteAddress?.zip,
        loc.primaryContact?.email,
        loc.primaryContact?.phone,
        loc.siteNote
      ];
      const matchesQuery = !q || fields.some(f => !!f && String(f).toLowerCase().includes(q));

      return matchesActive && matchesQuery;
    });
  }

  /* Clear the filter input and reset location list */
  clearFilter() {
    this.filterText = '';
    this.applyFilters();
  }

  /* Delete a location after confirmation */
  onDelete(id: number) {
    if (!Number.isFinite(id) || id <= 0) return;
    if (!confirm(`Delete location #${id}?`)) return;

    this.locationService.deleteLocation(id).subscribe({
      next: () => {
        this.locations = this.locations.filter(loc => loc.rowId !== id);
      },
      error: (err) => {
        console.error('Error deleting location:', err)
        alert('Failed to delete location. Please try again.');
      }
    });
  }
}