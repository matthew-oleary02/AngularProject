import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JobsService } from '../jobs.service';
import { Jobs } from '../jobs.model';
import { JobsETA } from '../jobs-eta.model';
import { JobsETAService } from '../jobs-eta.service';
import { JobsEquipment } from '../jobs-equipment.model';
import { JobsEquipmentService } from '../jobs-equipment.service';
import { JobNote } from '../jobs-notes.model';
import { JobsNotesService } from '../jobs-notes.service';
import { JobsVendorAssignment } from '../jobs-vendor-assignment.model';
import { JobsVendorAssignmentService } from '../jobs-vendor-assignment.service';

@Component({
  selector: 'app-jobs-view',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './jobs-view.html',
  styleUrls: ['../../styles/view.css'],
})

export class JobsViewComponent implements OnInit {
  jobs?: Jobs;
  activeTab: string = 'jobStatusNotes';  // single tab controller
  
  jobsEta: JobsETA[] = [];
  allJobsEta: JobsETA[] = [];
  
  jobsEquipment: JobsEquipment[] = [];
  allJobsEquipment: JobsEquipment[] = [];
  
  jobsNotes: JobNote[] = [];
  allJobsNotes: JobNote[] = [];
  activeNotesFilter: boolean | null = true;
  
  vendorAssignments: JobsVendorAssignment[] = [];
  allVendorAssignments: JobsVendorAssignment[] = [];
  
  filterText = '';

  constructor(
    private jobsService: JobsService,
    private jobsETAService: JobsETAService,
    private jobsEquipmentService: JobsEquipmentService,
    private jobsNotesService: JobsNotesService,
    private vendorAssignmentService: JobsVendorAssignmentService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /* Load job details based on route parameter and fetch corresponding lists */
  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      console.error('Invalid job ID', idParam);
      return;
    }
    
    /* Fetch job details from the service */
    this.jobsService.getJob(id).subscribe({
      next: oc => {
        this.jobs = oc;
        this.fetchAllLists();
      },
      error: err => console.error('Error fetching job:', err)
    });
  }
  
  private fetchAllLists() {
    /* Fetch all job ETA records */
    this.jobsETAService.getJobsEtas().subscribe({
      next: etas => {
        this.allJobsEta = etas || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching job ETAs:', err)
    });
    
    /* Fetch equipment */
    this.jobsEquipmentService.getJobsEquipment().subscribe({
      next: eq => {
        this.allJobsEquipment = eq || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching equipment:', err)
    });
    
    /* Fetch notes */
    this.jobsNotesService.getJobsNotes().subscribe({
      next: notes => {
        this.allJobsNotes = notes || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching notes:', err)
    });
    
    /* Fetch vendor assignments */
    this.vendorAssignmentService.getContractStatuses().subscribe({
      next: va => {
        this.allVendorAssignments = va || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching vendor assignments:', err)
    });
  }

  /* Filter lists based on user input */
  onFilterChange(query: string) {
    this.filterText = query || '';
    this.applyFilters();
  }

  /* Clear the filter input and reset lists */
  clearFilter() {
    this.filterText = '';
    this.applyFilters();
  }
  
  onNotesActiveToggle(checked: boolean) {
    this.activeNotesFilter = checked;
    this.applyFilters();
  }

  /* Filter lists for the current job and query */
  private applyFilters() {
    if (!this.jobs) return;
    const q = this.filterText.toLowerCase().trim();

    // ETA filter
    this.jobsEta = this.allJobsEta.filter(eta => {
      const matchesJob = eta.job === this.jobs?.jobNumber;
      const fields = [eta.serviceType, eta.etaHours, eta.hoursBusDays];
      const matchesQuery = !q || fields.some(f => !!f && String(f).toLowerCase().includes(q));
      return matchesJob && matchesQuery;
    });
    
    // Equipment filter
    this.jobsEquipment = this.allJobsEquipment.filter(eq => {
      const matchesJob = eq.job === this.jobs?.jobNumber;
      const fields = [eq.location, eq.entryStatus, eq.manufacturer, eq.model, eq.serialNumber, eq.tonnage, eq.age, eq.condition, eq.typeOfUnit, eq.dateLoaded];
      const matchesQuery = !q || fields.some(f => !!f && String(f).toLowerCase().includes(q));
      return matchesJob && matchesQuery;
    });
    
    // Notes filter
    this.jobsNotes = this.allJobsNotes.filter(note => {
      const matchesJob = note.job === this.jobs?.jobNumber;
      const matchesActive = this.activeNotesFilter === null ? true : (note.active === this.activeNotesFilter);
      const fields = [note.status, note.message];
      const matchesQuery = !q || fields.some(f => !!f && String(f).toLowerCase().includes(q));
      return matchesJob && matchesActive && matchesQuery;
    });
    
    // Vendor assignments filter
    this.vendorAssignments = this.allVendorAssignments.filter(va => {
      const matchesJob = va.jobId === this.jobs?.rowId;
      const fields = [va.status, va.createdBy, va.modifiedBy];
      const matchesQuery = !q || fields.some(f => !!f && String(f).toLowerCase().includes(q));
      return matchesJob && matchesQuery;
    });
  }

  /* Delete handlers */
  onDeleteEta(id: number) {
    if (!Number.isFinite(id) || id <= 0) return;
    if (!confirm('Delete this Job ETA?')) return;
    this.jobsETAService.deleteJobsEta(id).subscribe({
      next: () => {
        this.allJobsEta = this.allJobsEta.filter(eta => eta.rowId !== id);
        this.applyFilters();
      },
      error: err => { console.error(err); alert('Failed to delete Job ETA.'); }
    });
  }
  
  onDeleteEquipment(id: number) {
    if (!Number.isFinite(id) || id <= 0) return;
    if (!confirm('Delete this Equipment?')) return;
    this.jobsEquipmentService.deleteJobsEquipment(id).subscribe({
      next: () => {
        this.allJobsEquipment = this.allJobsEquipment.filter(eq => eq.rowId !== id);
        this.applyFilters();
      },
      error: err => { console.error(err); alert('Failed to delete Equipment.'); }
    });
  }
  
  onDeleteNote(id: number) {
    if (!Number.isFinite(id) || id <= 0) return;
    if (!confirm('Delete this Note?')) return;
    this.jobsNotesService.deleteJobNote(id).subscribe({
      next: () => {
        this.allJobsNotes = this.allJobsNotes.filter(note => note.rowId !== id);
        this.applyFilters();
      },
      error: err => { console.error(err); alert('Failed to delete Note.'); }
    });
  }
  
  onDeleteVendorAssignment(id: number) {
    if (!Number.isFinite(id) || id <= 0) return;
    if (!confirm('Delete this Vendor Assignment?')) return;
    this.vendorAssignmentService.deleteContractStatus(id).subscribe({
      next: () => {
        this.allVendorAssignments = this.allVendorAssignments.filter(va => va.rowId !== id);
        this.applyFilters();
      },
      error: err => { console.error(err); alert('Failed to delete Vendor Assignment.'); }
    });
  }
}