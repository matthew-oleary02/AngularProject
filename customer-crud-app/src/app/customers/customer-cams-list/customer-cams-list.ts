import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CustomerCAMs } from '../customer-cams.model';
import { CustomerCAMsService } from '../customer-cams.service';

@Component({
  selector: 'app-customer-cams-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './customer-cams-list.html',
  styleUrls: ['../../styles/list.css'],
})
export class CustomerCamsListComponent implements OnInit {
  /* List of cc to display */
  customerCams: CustomerCAMs[] = [];
  /* Full list of cc from the server */
  private allCC: CustomerCAMs[] = [];
  filterText = '';
  activeFilter: boolean | null = true;

  constructor(private customerCamsService: CustomerCAMsService) {}

  /* Load all cc on component initialization */
  ngOnInit() {
    this.customerCamsService.getCCs().subscribe({
      next: cc => {
        this.allCC = cc || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching customer CAM:', err)
    });
  }

  /* Filter cc based on user input */
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

  /* Central filter logic: text toggle */
  private applyFilters() {
    const q = this.filterText.toLowerCase().trim();

    this.customerCams = this.allCC.filter(cc => {
      // active filter: if activeFilter is null, don't filter by active; otherwise match boolean
      const matchesActive = this.activeFilter === null ? true : (cc.active === this.activeFilter);

      // text search across multiple fields
      const fields = [
        cc.customer,
        cc.username,
        cc.email,
        cc.phone,
        cc.trade,
        cc.active,
      ];
      const matchesQuery = !q || fields.some(f => !!f && String(f).toLowerCase().includes(q));

      return matchesActive && matchesQuery;
    });
  }

  /* Clear the filter input and reset cc list */
  clearFilter() {
    this.filterText = '';
    this.applyFilters();
  }

  /* Delete a cc after confirmation */
  onDelete(id: number) {
    if (!Number.isFinite(id) || id <= 0) return;
    if (!confirm(`Delete customer CAM #${id}?`)) return;

    this.customerCamsService.deleteCC(id).subscribe({
      next: () => {
        this.customerCams = this.customerCams.filter(cc => cc.rowId !== id);
      },
      error: (err) => {
        console.error('Error deleting cc:', err)
        alert('Failed to delete cc. Please try again.');
      }
    });
  }
}