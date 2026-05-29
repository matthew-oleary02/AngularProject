import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { JobsEquipmentService } from '../jobs-equipment.service';
import { JobsEquipment } from '../jobs-equipment.model';

@Component({
  selector: 'app-jobs-equipment-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './jobs-equipment-list.html',
  styleUrls: ['../../styles/list.css'],
})
export class JobsEquipmentListComponent implements OnInit {
  /* List of locations to display */
  jobsEquipment: JobsEquipment[] = [];
  /* Full list of locations from the server */
  private allJobsEquipment: JobsEquipment[] = [];
  filterText = '';
  activeFilter: boolean | null = true;

  constructor(private jobsEquipmentService: JobsEquipmentService) {}

  /* Load all equipment on component initialization */
  ngOnInit() {
    this.jobsEquipmentService.getJobsEquipment().subscribe({
      next: eq => {
        this.allJobsEquipment = eq || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching jobsEquipment:', err)
    });
  }

  /* Filter equipment based on user input */
  onFilterChange(query: string) {
    this.filterText = query || '';
    this.applyFilters();
  }

  /* Central filter logic: text toggle */
  private applyFilters() {
    const q = this.filterText.toLowerCase().trim();

    this.jobsEquipment = this.allJobsEquipment.filter(eq => {
      // active filter: if activeFilter is null, don't filter by active; otherwise match boolean

      // text search across multiple fields
      const fields = [
        eq.job,
        eq.location,
        eq.entryStatus,
        eq.manufacturer,
        eq.model,
        eq.serialNumber,
        eq.tonnage,
        eq.age,
        eq.condition,
        eq.typeOfUnit,
        eq.dateLoaded
      ];
      const matchesQuery = !q || fields.some(f => !!f && String(f).toLowerCase().includes(q));

      return matchesQuery;
    });
  }

  /* Clear the filter input and reset equipment list */
  clearFilter() {
    this.filterText = '';
    this.applyFilters();
  }

  /* Delete a equipment after confirmation */
  onDelete(id: number) {
    if (!Number.isFinite(id) || id <= 0) return;
    if (!confirm(`Delete equipment #${id}?`)) return;

    this.jobsEquipmentService.deleteJobsEquipment(id).subscribe({
      next: () => {
        this.jobsEquipment = this.jobsEquipment.filter(eq => eq.rowId !== id);
      },
      error: (err) => {
        console.error('Error deleting jobsEquipment:', err)
        alert('Failed to delete equipment. Please try again.');
      }
    });
  }
}