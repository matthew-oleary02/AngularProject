import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { JobNote } from '../jobs-notes.model';
import { JobsNotesService } from '../jobs-notes.service';

@Component({
  selector: 'app-jobs-notes-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './jobs-notes-list.html',
  styleUrls: ['../../styles/list.css'],
})
export class JobsNotesListComponent implements OnInit {
  @Input() jobId: number | null = null;
  /* List of job notes to display */
  jobsNotes: JobNote[] = [];
  /* Full list of job notes from the server */
  private allJobsNotes: JobNote[] = [];
  filterText = '';
  activeFilter: boolean | null = true;

  constructor(private jobsNotesService: JobsNotesService) {}

  /* Load all job notes on component initialization */
  ngOnInit() {
    this.jobsNotesService.getJobsNotes().subscribe({
      next: notes => {
        this.allJobsNotes = notes || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching job notes:', err)
    });
  }

  /* Filter job notes based on user input */
  onFilterChange(query: string) {
    this.filterText = query || '';
    this.applyFilters();
  }

  /* Called when the Active checkbox is toggled */
  onActiveToggle(checked: boolean) {
    this.activeFilter = checked;
    this.applyFilters();
  }

  /* Central filter logic: text + active toggle */
  private applyFilters() {
    const q = this.filterText.toLowerCase().trim();

    this.jobsNotes = this.allJobsNotes.filter(note => {
      // Filter by jobId if provided
      const matchesJob = this.jobId === null ? true : (note.rowId === this.jobId); // placeholder
      
      const matchesActive = this.activeFilter === null ? true : (note.active === this.activeFilter);

      // text search across multiple fields
      const fields = [
        note.job,
        note.status,
        note.message,
      ];
      const matchesQuery = !q || fields.some(f => !!f && String(f).toLowerCase().includes(q));

      return matchesActive && matchesQuery; // && matchesJob
    });
  }

  /* Clear the filter input and reset job notes list */
  clearFilter() {
    this.filterText = '';
    this.applyFilters();
  }

  /* Delete a job note after confirmation */
  onDelete(id: number) {
    if (!Number.isFinite(id) || id <= 0) return;
    if (!confirm(`Delete job note #${id}?`)) return;

    this.jobsNotesService.deleteJobNote(id).subscribe({
      next: () => {
        this.jobsNotes = this.jobsNotes.filter(note => note.rowId !== id);
      },
      error: (err) => {
        console.error('Error deleting job note:', err)
        alert('Failed to delete job note. Please try again.');
      }
    });
  }
}
