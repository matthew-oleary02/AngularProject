import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { VendorService } from '../vendors.service';
import { Vendor } from '../vendors.model';
import { VendorAssetListComponent } from '../vendor-asset-list/vendor-asset-list';
import { VendorCoverageListComponent } from '../vendor-coverage-list/vendor-coverage-list';
import { VendorJobsListComponent } from '../vendor-jobs-list/vendor-jobs-list';
import { VendorUsersListComponent } from '../vendor-users-list/vendor-users-list';
import { VendorNotesListComponent } from '../vendor-notes-list/vendor-notes-list';
import { VendorMapListComponent } from '../vendor-map-list/vendor-map-list';
import { VendorClassificationListComponent } from '../vendor-classification-list/vendor-classification-list';
import { VendorContractStatusListComponent } from '../vendor-contract-status-list/vendor-contract-status-list';

@Component({
  selector: 'app-vendor-view',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    VendorAssetListComponent,
    VendorCoverageListComponent,
    VendorJobsListComponent,
    VendorUsersListComponent,
    VendorNotesListComponent,
    VendorMapListComponent,
    VendorClassificationListComponent,
    VendorContractStatusListComponent
  ],
  templateUrl: './vendors-view.html',
  styleUrls: ['../../styles/view.css'],
})

export class VendorsViewComponent implements OnInit {
  vendor?: Vendor;
  activeTab: string = 'vendorJobs';

  constructor(private vendorService: VendorService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /* Load vendor details based on route parameter */
  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      console.error('Invalid vendor ID', idParam);
    };
    
    /* Fetch vendor details from the service */
    this.vendorService.getVendor(id).subscribe({
      next: v => this.vendor = v,
      error: err => console.error('Error fetching vendor:', err)
    });
  }
}