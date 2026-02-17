import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { JobsService } from '../jobs.service';
import { Jobs } from '../jobs.model';

@Component({
    selector: 'app-jobs-list',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './jobs-list.html',
    styleUrls: ['./jobs-list.css']
})

export class JobsListComponent implements OnInit {
    jobs: Jobs[] = [];
    private allJobs: Jobs[] = [];
    filterText = ''
    activeFilter: boolean | null = true;

    constructor(private jobsService: JobsService) {}

    ngOnInit() {
        this.jobsService.getJobs().subscribe({
            next: j => {
                this.allJobs = j || [];
                this.applyFilters();
            },
            error: err => console.error('Error fetching jobs:', err)
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
            const matchesActive = this.activeFilter === null ? true : (job.active === this.activeFilter);
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
            const matchesText = fields.some(f => f?.toLowerCase().includes(q));
            return matchesActive && matchesText;
        });
    }

    clearFilter() {
        this.filterText = '';
        this.applyFilters();
    }

    onDelete(id: number) {
    if (!Number.isFinite(id) || id <= 0) return;
    if (!confirm(`Delete job #${id}?`)) return;

    this.jobsService.deleteJob(id).subscribe({
      next: () => {
        this.jobs = this.jobs.filter(j => j.rowId !== id);
      },
      error: (err) => {
        console.error('Error deleting job:', err)
        alert('Failed to delete job. Please try again.');
      }
    });
  }
}

