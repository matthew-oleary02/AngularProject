import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CustomerService } from '../customer.service';
import { Customer } from '../customer.model';
import { Location } from '../location.model';
import { LocationService } from '../location.service';
import { CustomerStatusMessage } from '../status-messages.model';
import { CustomerStatusMessageService } from '../status-messages.service';
import { CustomerCAMs } from '../customer-cams.model';
import { CustomerCAMsService } from '../customer-cams.service';
import { CustomerNTE } from '../customer-nte.model';
import { CustomerNTEService } from '../customer-nte.service';
import { CustomerETA } from '../customer-eta.model';
import { CustomerETAService } from '../customer-eta.service';
import { CustomerRates } from '../customer-rates.model';
import { CustomerRatesService } from '../customer-rates.service';
import { ServiceTypes } from '../service-types.model';
import { ServiceTypesService } from '../service-types.service';

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
  customerCams: CustomerCAMs[] = [];
  customerNte: CustomerNTE[] = [];
  customerEta: CustomerETA[] = [];
  customerRates: CustomerRates[] = [];
  serviceTypes: ServiceTypes[] = [];
  /* Full list of locations from the server */
  private allLocations: Location[] = [];
  /* Full list of status messages from the server */
  private allStatusMessages: CustomerStatusMessage[] = [];
  /* Full list of customer CAMs from the server */
  private allCustomerCams: CustomerCAMs[] = [];
  private allCustomerNte: CustomerNTE[] = [];
  private allCustomerEta: CustomerETA[] = [];
  private allCustomerRates: CustomerRates[] = [];
  private allServiceTypes: ServiceTypes[] = [];
  filterText = '';
  activeFilter: boolean | null = true;
  activeTab: string = 'sites';  // single tab controller

  constructor(private customerService: CustomerService,
    private router: Router,
    private route: ActivatedRoute,
    private locationService: LocationService,
    private statusMessageService: CustomerStatusMessageService,
    private customerCamsService: CustomerCAMsService,
    private customerNteService: CustomerNTEService,
    private customerEtaService: CustomerETAService,
    private customerRatesService: CustomerRatesService,
    private serviceTypesService: ServiceTypesService
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

    /* Fetch customer CAMs for the customer */
    this.customerService.getCustomerCams(id).subscribe({
      next: cc => {
        this.allCustomerCams = cc || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching customer CAMs:', err)
    });

    /* Fetch customer NTE for the customer */
    this.customerService.getCustomerNotToExceed(id).subscribe({
      next: nte => {
        this.allCustomerNte = nte || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching customer NTE:', err)
    });

    /* Fetch customer ETA for the customer */
    this.customerService.getCustomerEstimatedTimeArrival(id).subscribe({
      next: eta => {
        this.allCustomerEta = eta || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching customer ETA:', err)
    });

    /* Fetch customer Rates for the customer */
    this.customerService.getCustomerRates(id).subscribe({
      next: rates => {
        this.allCustomerRates = rates || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching customer Rates:', err)
    });

     /* Fetch customer Service Types for the customer */
    this.customerService.getCustomerServiceTypes(id).subscribe({
      next: st => {
        this.allServiceTypes = st || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching customer Service Types:', err)
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
    });

    this.customerCams = this.allCustomerCams.filter(cc => {
      // active filter: if activeFilter is null, don't filter by active; otherwise match boolean
      const matchesActive = this.activeFilter === null ? true : (cc.active === this.activeFilter);
      // text search across multiple fields
      const fields = [
        cc.customer,
        cc.username,
        cc.email,
        cc.phone,
        cc.trade
      ];
      const matchesQuery = !q || fields.some(f => !!f && String(f).toLowerCase().includes(q));
      return matchesActive && matchesQuery;
    });

    this.customerNte = this.allCustomerNte.filter(nte => {
      // active filter: if activeFilter is null, don't filter by active; otherwise match boolean
      //const matchesActive = this.activeFilter === null ? true : (nte.active === this.activeFilter);
      // text search across multiple fields
      const fields = [
        nte?.classification,
        nte?.serviceType,
        nte?.rateNTE,
        nte?.vendorNte,
        nte?.note
      ];
      const matchesQuery = !q || fields.some(f => !!f && String(f).toLowerCase().includes(q));
      return /*matchesActive &&*/ matchesQuery;
    });

    this.customerEta = this.allCustomerEta.filter(eta => {
      // active filter: if activeFilter is null, don't filter by active; otherwise match boolean
      //const matchesActive = this.activeFilter === null ? true : (eta.active === this.activeFilter);
      // text search across multiple fields
      const fields = [
        eta?.customer,
        eta?.serviceType,
        eta?.etaHours,
        eta?.hoursBusDays
      ];
      const matchesQuery = !q || fields.some(f => !!f && String(f).toLowerCase().includes(q));
      return /*matchesActive &&*/ matchesQuery;
    });

    this.customerRates = this.allCustomerRates.filter(rate => {
      // active filter: if activeFilter is null, don't filter by active; otherwise match boolean
      //const matchesActive = this.activeFilter === null ? true : (rate.active === this.activeFilter);
      // text search across multiple fields
      const fields = [
        rate?.customer,
        rate?.trade,
        rate?.rateType,
        rate?.state,
        rate?.rate
      ];
      const matchesQuery = !q || fields.some(f => !!f && String(f).toLowerCase().includes(q));
      return /*matchesActive &&*/ matchesQuery;
    });

    this.serviceTypes = this.allServiceTypes.filter(st => {
      // active filter: if activeFilter is null, don't filter by active; otherwise match boolean
      //const matchesActive = this.activeFilter === null ? true : (st.active === this.activeFilter);
      // text search across multiple fields
      const fields = [
        st?.customer,
        st?.serviceType
      ];
      const matchesQuery = !q || fields.some(f => !!f && String(f).toLowerCase().includes(q));
      return /*matchesActive &&*/ matchesQuery;
    });
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
    } else if (this.activeTab === 'customerCams') {
      if (!confirm(`Delete customer CAM #${id}?`)) return;
      this.customerCamsService.deleteCC(id).subscribe({
        next: () => {
          this.allCustomerCams = this.allCustomerCams.filter(cc => cc.rowId !== id);
          this.applyFilters();
        },
        error: (err) => {
          console.error('Error deleting customer CAM:', err)
          alert('Failed to delete customer CAM. Please try again.');
        }
      });
    } else if (this.activeTab === 'customerNte') {
      if (!confirm('Delete this customer NTE?')) return;
      this.customerNteService.deleteCustomerNte(id).subscribe({
        next: () => {
          this.allCustomerNte = this.allCustomerNte.filter(nte => nte.rowId !== id);
          this.applyFilters();
        },
        error: (err) => {
          console.error('Error deleting customer NTE:', err)
          alert('Failed to delete customer NTE. Please try again.');
        }
    });
    } else if (this.activeTab === 'customerEta') {
      if (!confirm('Delete this customer ETA?')) return;
      this.customerEtaService.deleteCustomerEta(id).subscribe({
        next: () => {
          this.allCustomerEta = this.allCustomerEta.filter(eta => eta.rowId !== id);
          this.applyFilters();
        },
        error: (err) => {
          console.error('Error deleting customer ETA:', err)
          alert('Failed to delete customer ETA. Please try again.');
        }
      });
    } else if (this.activeTab === 'customerRates') {
      if (!confirm('Delete this customer Rate?')) return;
      this.customerRatesService.deleteCustomerRate(id).subscribe({
        next: () => {
          this.allCustomerRates = this.allCustomerRates.filter(rate => rate.rowId !== id);
          this.applyFilters();
        },
        error: (err) => {
          console.error('Error deleting customer Rate:', err)
          alert('Failed to delete customer Rate. Please try again.');
        }
      });
    } else if (this.activeTab === 'serviceTypes') {
      if (!confirm('Delete this customer Service Type?')) return;
      this.serviceTypesService.deleteServiceType(id).subscribe({
        next: () => {
          this.allServiceTypes = this.allServiceTypes.filter(st => st.rowId !== id);
          this.applyFilters();
        },
        error: (err) => {
          console.error('Error deleting customer Service Type:', err)
          alert('Failed to delete customer Service Type. Please try again.');
        }
      });
    }
  }
}