import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CustomerService } from '../customer.service';
import { Customer } from '../customer.model';
import { Location } from '../location.model';
import { LocationService } from '../location.service';
import { CustomerStatusMessage } from '../status-messages.model';
import { CustomerStatusMessageService } from '../status-messages.service';

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
  statusMessages: CustomerStatusMessage[] = [];
  /* Full list of locations from the server */
  private allLocations: Location[] = [];
  /* Full list of status messages from the server */
  private allStatusMessages: CustomerStatusMessage[] = [];
  filterText = '';
  activeFilter: boolean | null = true;
  activeTab: string = 'sites';  // single tab controller

  constructor(private customerService: CustomerService,
    private router: Router,
    private route: ActivatedRoute,
    private locationService: LocationService,
    private statusMessageService: CustomerStatusMessageService
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

      /* Fetch status messages for the customer */
    this.customerService.getStatusMessages(id).subscribe({
      next: csm => {
        this.allStatusMessages = csm || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching status messages:', err)
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

    this.statusMessages = this.allStatusMessages.filter(csm => {
      // active filter: if activeFilter is null, don't filter by active; otherwise match boolean
      const matchesActive = this.activeFilter === null ? true : (csm.active === this.activeFilter);

      // text search across multiple fields
      const fields = [
        csm.customer,
        csm.status,
        csm.message
      ];
      const matchesQuery = !q || fields.some(f => !!f && String(f).toLowerCase().includes(q));
      
      return matchesActive && matchesQuery;
    }
    );
  }

  /* Clear the filter input and reset location list */
  clearFilter() {
    this.filterText = '';
    this.applyFilters();
  }

  /* Delete a location or status message after confirmation */
  onDelete(id: number) {
    if (!Number.isFinite(id) || id <= 0) return;

    if (this.activeTab === 'sites') {
      if (!confirm(`Delete location #${id}?`)) return;
      this.locationService.deleteLocation(id).subscribe({
        next: () => {
          this.allLocations = this.allLocations.filter(loc => loc.rowId !== id);
          this.applyFilters();
        },
        error: (err) => {
          console.error('Error deleting location:', err)
          alert('Failed to delete location. Please try again.');
        }
      });
    } else if (this.activeTab === 'statusMessages') {
      if (!confirm(`Delete status message #${id}?`)) return;
      this.statusMessageService.deleteCSM(id).subscribe({
        next: () => {
          this.allStatusMessages = this.allStatusMessages.filter(csm => csm.rowId !== id);
          this.applyFilters();
        },
        error: (err) => {
          console.error('Error deleting status message:', err)
          alert('Failed to delete status message. Please try again.');
        }
      });
    }
  }
}