import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ResourcesService } from '../resources.service';
import { Resources } from '../resources.model';

@Component({
  selector: 'app-resources-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './resources-list.html',
  styleUrls: ['../../styles/list.css'],
})
export class ResourcesListComponent implements OnInit {
  resources: Resources[] = [];
  private allResources: Resources[] = [];

  filterText = '';
  /**
   * activeFilter: boolean | null
   * - true  => show only active
   * - false => show only inactive (if you later add this)
   * - null  => show all
   */
  activeFilter: boolean | null = true;

  constructor(private resourcesService: ResourcesService) {}

  ngOnInit() {
    this.resourcesService.getResources().subscribe({
      next: r => {
        this.allResources = r || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching resources:', err)
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
    if (!confirm('Delete this resources?')) return;

    this.resourcesService.deleteResources(id).subscribe({
      next: () => {
        this.allResources = this.allResources.filter(r => r.rowId !== id);
        this.applyFilters();
      },
      error: err => console.error('Delete failed:', err)
    });
  }

  private applyFilters() {
    const q = this.filterText.toLowerCase().trim();

    this.resources = this.allResources.filter(r => {
      const matchesActive =
        this.activeFilter === null ? true : (r.contactInfo.active === this.activeFilter);

      const fields = [
        r.lname,
        r.fname,
        r.contactInfo.phone,
        r.contactInfo.cellphone,
        r.contactInfo.email,
        r.contactInfo.title,
        r.contactInfo.department,
        r.contactInfo.state,
        r.contactInfo.active?.toString(),
      ];
      const matchesText = q === '' || fields.some(f => f?.toString().toLowerCase().includes(q));
      return matchesActive && matchesText;
    });
  }
}
