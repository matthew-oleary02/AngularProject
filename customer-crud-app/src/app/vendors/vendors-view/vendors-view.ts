import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { VendorService } from '../vendors.service';
import { Vendor } from '../vendors.model';
import { JobsService } from '../../jobs/jobs.service';
import { VendorRatesService } from '../services/vendor-rates.service';
import { VendorNotificationsService } from '../services/vendor-notifications.service';
//import { VendorAssetListComponent } from '../vendor-asset-list/vendor-asset-list';
//import { VendorCoverageListComponent } from '../vendor-coverage-list/vendor-coverage-list';
//import { VendorUsersListComponent } from '../vendor-users-list/vendor-users-list';
//import { VendorNotesListComponent } from '../vendor-notes-list/vendor-notes-list';
import { VendorMapListComponent } from '../vendor-map-list/vendor-map-list';
//import { VendorClassificationListComponent } from '../vendor-classification-list/vendor-classification-list';
//import { VendorContractStatusListComponent } from '../vendor-contract-status-list/vendor-contract-status-list';
import { VendorAssetService } from '../services/vendor-asset.service';
import { VendorUsersService } from '../services/vendor-users.service';
import { VendorCoverageService } from '../vendor-coverage.service';
import { VendorNotesService } from '../services/vendor-notes.service';
import { VendorClassificationService } from '../services/vendor-classification.service';
import { VendorContractStatusService } from '../services/vendor-contract-status.service';

@Component({
  selector: 'app-vendor-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    //VendorAssetListComponent,
    //VendorCoverageListComponent,
    //VendorUsersListComponent,
    //VendorNotesListComponent,
    VendorMapListComponent,
    //VendorClassificationListComponent,
    //VendorContractStatusListComponent
  ],
  templateUrl: './vendors-view.html',
  styleUrls: ['../../styles/view.css'],
})

export class VendorsViewComponent implements OnInit {
  vendor?: Vendor;
  jobs: any[] = [];
  rates: any[] = [];
  notifications: any[] = [];
  vendorCoverage: any[] = [];
  vendorAssets: any[] = [];
  users: any[] = [];
  vendorNotes: any[] = [];
  vendorClassifications: any[] = [];
  vendorContractStatus: any[] = [];
  private allJobs: any[] = [];
  private allRates: any[] = [];
  private allNotifications: any[] = [];
  private allCoverage: any[] = [];
  private allVendorAssets: any[] = [];
  private allUsers: any[] = [];
  private allVendorNotes: any[] = [];
  private allVendorClassifications: any[] = [];
  private allVendorContractStatus: any[] = [];
  filterText = '';
  activeTab: string = 'vendorJobs';
  activeFilter: boolean | null = true;

  constructor(
    private vendorService: VendorService,
    private jobsService: JobsService,
    private ratesService: VendorRatesService,
    private notificationsService: VendorNotificationsService,
    private coverageService: VendorCoverageService,
    private vendorAssetService: VendorAssetService,
    private vendorUsersService: VendorUsersService,
    private vendorNotesService: VendorNotesService,
    private vendorClassificationsService: VendorClassificationService,
    private vendorContractStatusService: VendorContractStatusService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  /* Load vendor details based on route parameter */
  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      console.error('Invalid vendor ID', idParam);
      return;
    }

    /* Fetch vendor details from the service */
    this.vendorService.getVendor(id).subscribe({
      next: v => this.vendor = v,
      error: err => console.error('Error fetching vendor:', err)
    });

    /* Fetch jobs for the vendor */
    this.vendorService.getJobsByVendor(id).subscribe({
      next: jobs => {
        this.allJobs = jobs || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching jobs:', err)
    });

    /* Fetch rates for the vendor */
    this.vendorService.getRatesByVendor(id).subscribe({
      next: rates => {
        this.allRates = rates || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching rates:', err)
    });

    /* Fetch notifications for the vendor */
    this.vendorService.getNotificationsByVendor(id).subscribe({
      next: notifs => {
        this.allNotifications = notifs || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching notifications:', err)
    });

    /* Fetch coverage for the vendor */
    this.vendorService.getCoverageByVendor(id).subscribe({
      next: coverage => {
        this.allCoverage = coverage || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching coverage:', err)
    });

    /* Fetch assets for the vendor */
    this.vendorService.getAssetsByVendor(id).subscribe({
      next: assets => {
        this.allVendorAssets = assets || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching assets:', err)
    });

    /* Fetch users for the vendor */
    this.vendorService.getUsersByVendor(id).subscribe({
      next: users => {
        this.allUsers = users || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching users:', err)
    });

    /* Fetch notes for the vendor */
    this.vendorService.getNotesByVendor(id).subscribe({
      next: notes => {
        this.allVendorNotes = notes || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching notes:', err)
    });

    /* Fetch classifications for the vendor */
    this.vendorService.getClassificationsByVendor(id).subscribe({
      next: classifications => {
        this.allVendorClassifications = classifications || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching classifications:', err)
    });

    this.vendorService.getContractStatusesByVendor(id).subscribe({
      next: contractStatuses => {
        this.allVendorContractStatus = contractStatuses || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching contract statuses:', err)
    });
  }

  onFilterChange(query: string) {
    this.filterText = query || '';
    this.applyFilters();
  }

  onActiveToggle(checked: boolean) {
    this.activeFilter = checked;
    this.applyFilters();
  }

  private applyFilters() {
    const q = this.filterText.toLowerCase().trim();

    this.jobs = this.allJobs.filter(job => {
      const fields = [
        job?.jobNumber,
        job?.customer,
        job?.location,
        job?.clientTrackingNumber,
        job?.serviceType,
        job?.jobStatus,
        job?.trade,
        job?.vendor,
        job?.jobOwner,
        job?.caller,
        job?.jobNote
      ];
      return !q || fields.some(f => f?.toLowerCase().includes(q));
    });

    this.rates = this.allRates.filter(rate => {
      const fields = [
        rate?.vendorName,
        rate?.trade,
        rate?.rateType,
        rate?.state,
        rate?.rate?.toString()
      ];
      return !q || fields.some(f => f?.toLowerCase().includes(q));
    });

    this.notifications = this.allNotifications.filter(n => {
      const fields = [
        n?.vendorName,
        n?.status,
        n?.serviceType,
        n?.serviceClass,
        n?.email
      ];
      return !q || fields.some(f => f?.toLowerCase().includes(q));
    });

    this.vendorCoverage = this.allCoverage.filter(coverage => {
      const matchesActive = this.activeFilter === null ? true : (coverage.active === this.activeFilter);
      const fields = [
        coverage?.vendorName,
        coverage?.status,
        coverage?.city,
        coverage?.state,
        coverage?.zipCode,
        coverage?.trade,
        coverage?.rate?.toString(),
        coverage?.radius,
        coverage?.vendorStatus,
      ];
      const matchesQuery = !q || fields.some(f => f?.toLowerCase().includes(q));

      return matchesQuery && matchesActive;
    });

    this.vendorAssets = this.allVendorAssets.filter(asset => {
      const matchesActive = this.activeFilter === null ? true : (asset.active === this.activeFilter);
      const fields = [
        asset?.assetName,
        asset?.vendorId,
        asset?.active,
        asset?.startTime,
        asset?.endTime,
        asset?.monthly
      ];
      const matchesQuery = !q || fields.some(f => f?.toLowerCase().includes(q));

      return matchesQuery && matchesActive;
    });

    this.users = this.allUsers.filter(user => {
      const matchesActive = this.activeFilter === null ? true : (user.active === this.activeFilter);
      const fields = [
        user?.vendorName,
        user?.username,
        user?.email,
        user?.phone,
        user?.trade,
      ];
      const matchesQuery = !q || fields.some(f => f?.toLowerCase().includes(q));

      return matchesQuery && matchesActive;
    });

    this.vendorNotes = this.allVendorNotes.filter(note => {
      const matchesActive = this.activeFilter === null ? true : (note.active === this.activeFilter);
      const fields = [
        note?.vendorName,
        note?.note,
        note?.noteDate,
        note?.noteCreatedBy
      ];
      const matchesQuery = !q || fields.some(f => f?.toLowerCase().includes(q));

      return matchesQuery && matchesActive;
    });

    this.vendorClassifications = this.allVendorClassifications.filter(classification => {
      const fields = [
        classification?.classification,
        classification?.createdBy,
      ];
      return !q || fields.some(f => f?.toLowerCase().includes(q));
    });

    this.vendorContractStatus = this.allVendorContractStatus.filter(status => {
      const fields = [
        status?.status,
        status?.createdBy,
      ];
      return !q || fields.some(f => f?.toLowerCase().includes(q));
    });
  }

  clearFilter() {
    this.filterText = '';
    this.applyFilters();
  }

  onDeleteJob(id: number) {
    if (!confirm('Delete this job?')) return;
    this.jobsService.deleteJob(id).subscribe({
      next: () => {
        this.allJobs = this.allJobs.filter(j => j.rowId !== id);
        this.applyFilters();
      },
      error: err => console.error('Error deleting job:', err)
    });
  }

  onDeleteRate(id: number) {
    if (!confirm('Delete this rate?')) return;
    this.ratesService.deleteVendorRate(id).subscribe({
      next: () => {
        this.allRates = this.allRates.filter(r => r.rowId !== id);
        this.applyFilters();
      },
      error: err => console.error('Error deleting rate:', err)
    });
  }

  onDeleteNotification(id: number) {
    if (!confirm('Delete this notification?')) return;
    this.notificationsService.deleteVendorNotification(id).subscribe({
      next: () => {
        this.allNotifications = this.allNotifications.filter(n => n.rowId !== id);
        this.applyFilters();
      },
      error: err => console.error('Error deleting notification:', err)
    });
  }

  onDeleteCoverage(id: number) {
    if (!confirm('Delete this coverage?')) return;
    this.coverageService.deleteVendorCoverage(id).subscribe({
      next: () => {
        this.allCoverage = this.allCoverage.filter(c => c.rowId !== id);
        this.applyFilters();
      },
      error: err => console.error('Error deleting coverage:', err)
    });
  }

  onDeleteAsset(id: number) {
    if (!confirm('Delete this asset?')) return;
    this.vendorAssetService.deleteVendorAsset(id).subscribe({
      next: () => {
        this.allVendorAssets = this.allVendorAssets.filter(asset => asset.rowId !== id);
        this.applyFilters();
      },
      error: err => console.error('Error deleting asset:', err)
    });
  }

  onDeleteUser(id: number) {
    if (!id || !confirm('Delete this user?')) return;
    this.vendorUsersService.deleteVendorUser(id).subscribe({
      next: () => {
        this.allUsers = this.allUsers.filter(user => user.rowId !== id);
        this.applyFilters();
      },
      error: err => console.error('Error deleting user:', err)
    });
  }

  onDeleteNote(id: number) {
    if (!id || !confirm('Delete this note?')) return;
    this.vendorNotesService.deleteVendorNote(id).subscribe({
      next: () => {
        this.allVendorNotes = this.allVendorNotes.filter(note => note.rowId !== id);
        this.applyFilters();
      },
      error: err => console.error('Error deleting note:', err)
    });
  }

  onDeleteClassification(id: number) {
    if (!id || !confirm('Delete this classification?')) return;
    this.vendorClassificationsService.deleteClassification(id).subscribe({
      next: () => {
        this.allVendorClassifications = this.allVendorClassifications.filter(classification => classification.rowId !== id);
        this.applyFilters();
      },
      error: err => console.error('Error deleting classification:', err)
    });
  }

  onDeleteContractStatus(id: number) {
    if (!id || !confirm('Delete this contract status?')) return;
    this.vendorContractStatusService.deleteContractStatus(id).subscribe({
      next: () => {
        this.allVendorContractStatus = this.allVendorContractStatus.filter(status => status.rowId !== id);
        this.applyFilters();
      },
      error: err => console.error('Error deleting contract status:', err)
    });
  }
}