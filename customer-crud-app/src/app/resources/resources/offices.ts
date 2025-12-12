
// offices.ts
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OfficesService } from '../offices.service';
import { Office } from '../offices.model';

@Component({
  selector: 'app-office-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './offices.html',
  styleUrls: ['./offices.css'],
})
export class OfficesComponent implements OnInit {
  offices: Office[] = [];
  private allOffices: Office[] = [];

  filterText = '';
  /**
   * activeFilter: boolean | null
   * - true  => show only active
   * - false => show only inactive (if you later add this)
   * - null  => show all
   */
  activeFilter: boolean | null = true;

  constructor(private officesService: OfficesService) {}

  ngOnInit() {
    this.officesService.getOffices().subscribe({
      next: o => {
        this.allOffices = o || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching offices:', err)
    });
  }

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

  clearFilter() {
    this.filterText = '';
    this.applyFilters();
  }

  onDelete(id: number) {
    if (!id) return;
    if (!confirm('Delete this office?')) return;

    this.officesService.deleteOffice(id).subscribe({
      next: () => {
        this.allOffices = this.allOffices.filter(o => o.id !== id);
        this.applyFilters();
      },
      error: err => console.error('Delete failed:', err)
    });
  }

  private applyFilters() {
    const q = this.filterText.toLowerCase().trim();

    this.offices = this.allOffices.filter(o => {
      const matchesActive =
        this.activeFilter === null ? true : (o.active === this.activeFilter);

      const fields = [
        o.name,
        o.address1,
        o.address2,
        o.city,
        o.state,
        o.zip,
        o.county,
        o.country,
        o.phone,
        o.active?.toString()
      ];
      const matchesText = q === '' || fields.some(f => f?.toLowerCase().includes(q));
      return matchesActive && matchesText;
    });
  }
}
