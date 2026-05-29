/*
import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { JobsVendorAssignmentService } from '../jobs-vendor-assignment.service';
import { JobsVendorAssignment } from '../jobs-vendor-assignment.model';

@Component({
  selector: 'app-jobs-vendor-assignment-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './jobs-vendor-assignment-list.html',
  styleUrls: ['../../styles/list.css'],
})
export class JobsVendorAssignmentListComponent implements OnInit {
  @Input() jobId: number | null = null;
  statuses: JobsVendorAssignment[] = [];
  private allStatuses: JobsVendorAssignment[] = [];
  filterText = '';

  constructor(private statusService: JobsVendorAssignmentService) {}

  ngOnInit() {
    this.statusService.getContractStatuses().subscribe({
      next: data => {
        this.allStatuses = data || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching job contract statuses:', err)
    });
  }

  onFilterChange(query: string) {
    this.filterText = query || '';
    this.applyFilters();
  }

  private applyFilters() {
    const q = this.filterText.toLowerCase().trim();

    this.statuses = this.allStatuses.filter(s => {
      // Filter by jobId if provided
      const matchesJob = this.jobId === null ? true : (s.jobId === this.jobId);
      
      const fields = [
        s.status,
        s.createdBy,
        s.modifiedBy
      ];
      const matchesQuery = !q || fields.some(f => !!f && String(f).toLowerCase().includes(q));
      
      return matchesJob && matchesQuery;
    });
  }

  clearFilter() {
    this.filterText = '';
    this.applyFilters();
  }

  onDelete(id: number) {
    if (!Number.isFinite(id) || id <= 0) return;
    if (!confirm(`Delete contract status #${id}?`)) return;

    this.statusService.deleteContractStatus(id).subscribe({
      next: () => {
        this.statuses = this.statuses.filter(s => s.rowId !== id);
      },
      error: (err) => {
        console.error('Error deleting contract status:', err);
        alert('Failed to delete contract status. Please try again.');
      }
    });
  }
}
*/