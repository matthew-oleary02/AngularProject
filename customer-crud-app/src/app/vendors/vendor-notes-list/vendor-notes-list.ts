import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VendorNote } from '../models/vendor-notes.model';
import { VendorNotesService } from '../services/vendor-notes.service';

@Component({
  selector: 'app-vendor-notes-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vendor-notes-list.html',
  styleUrls: ['../../styles/list.css'],
})
export class VendorNotesListComponent implements OnInit {
  @Input() vendorId: number | null = null;
  /* List of vendor notes to display */
  vendorNotes: VendorNote[] = [];
  /* Full list of vendor notes from the server */
  private allVendorNotes: VendorNote[] = [];
  filterText = '';
  activeFilter: boolean | null = true;

  constructor(private vendorNotesService: VendorNotesService) {}

  /* Load all vendor notes on component initialization */
  ngOnInit() {
    this.vendorNotesService.getVendorNotes().subscribe({
      next: notes => {
        this.allVendorNotes = notes || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching vendor notes:', err)
    });
  }

  /* Filter vendor notes based on user input */
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

    this.vendorNotes = this.allVendorNotes.filter(note => {
      // Filter by vendorId if provided
      const matchesVendor = this.vendorId === null ? true : (note.rowId === this.vendorId); // placeholder
      
      const matchesActive = this.activeFilter === null ? true : (note.active === this.activeFilter);

      // text search across multiple fields
      const fields = [
        note.vendor,
        note.status,
        note.message,
      ];
      const matchesQuery = !q || fields.some(f => !!f && String(f).toLowerCase().includes(q));

      return matchesActive && matchesQuery; // && matchesVendor
    });
  }

  /* Clear the filter input and reset vendor notes list */
  clearFilter() {
    this.filterText = '';
    this.applyFilters();
  }

  /* Delete a vendor note after confirmation */
  onDelete(id: number) {
    if (!Number.isFinite(id) || id <= 0) return;
    if (!confirm(`Delete vendor note #${id}?`)) return;

    this.vendorNotesService.deleteVendorNote(id).subscribe({
      next: () => {
        this.vendorNotes = this.vendorNotes.filter(note => note.rowId !== id);
      },
      error: (err) => {
        console.error('Error deleting vendor note:', err)
        alert('Failed to delete vendor note. Please try again.');
      }
    });
  }
}
