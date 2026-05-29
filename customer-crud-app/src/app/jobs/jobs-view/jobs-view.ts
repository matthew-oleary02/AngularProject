import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { JobsService } from '../jobs.service';
import { Jobs } from '../jobs.model';
import { JobsETA } from '../jobs-eta.model';
import { JobsETAService } from '../jobs-eta.service';

@Component({
  selector: 'app-jobs-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './jobs-view.html',
  styleUrls: ['../../styles/view.css'],
})

export class JobsViewComponent implements OnInit {
  jobs?: Jobs;
  activeTab: string = 'jobStatusNotes';  // single tab controller
  jobsEta: JobsETA[] = [];
  allJobsEta: JobsETA[] = [];
  filterText = '';

  constructor(
    private jobsService: JobsService,
    private jobsETAService: JobsETAService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /* Load job details based on route parameter and fetch corresponding ETAs */
  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      console.error('Invalid job ID', idParam);
    }
    
    /* Fetch job details from the service */
    this.jobsService.getJob(id).subscribe({
      next: oc => {
        this.jobs = oc;
        this.applyFilters();
      },
      error: err => console.error('Error fetching job:', err)
    });

    /* Fetch all job ETA records */
    this.jobsETAService.getJobsEtas().subscribe({
      next: etas => {
        this.allJobsEta = etas || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching job ETAs:', err)
    });
  }

  /* Filter locations based on user input */
  onFilterChange(query: string) {
    this.filterText = query || '';
    this.applyFilters();
  }

  /* Clear the filter input and reset location list */
  clearFilter() {
    this.filterText = '';
    this.applyFilters();
  }

  /* Filter job ETAs for the current job number and query */
  private applyFilters() {
    if (!this.jobs) return;
    const q = this.filterText.toLowerCase().trim();

    this.jobsEta = this.allJobsEta.filter(eta => {
      const matchesJob = eta.job === this.jobs?.jobNumber;
      const fields = [
        eta.serviceType,
        eta.etaHours,
        eta.hoursBusDays
      ];
      const matchesQuery = !q || fields.some(f => !!f && String(f).toLowerCase().includes(q));
      return matchesJob && matchesQuery;
    });
  }

  /* Delete a job ETA record after confirmation */
  onDelete(id: number) {
    if (!Number.isFinite(id) || id <= 0) return;
    if (!confirm('Delete this Job ETA?')) return;

    this.jobsETAService.deleteJobsEta(id).subscribe({
      next: () => {
        this.allJobsEta = this.allJobsEta.filter(eta => eta.rowId !== id);
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error deleting job ETA:', err);
        alert('Failed to delete Job ETA. Please try again.');
      }
    });
  }
}