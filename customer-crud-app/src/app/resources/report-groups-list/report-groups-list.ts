import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReportGroupsService } from '../report-groups.service';
import { ReportGroups } from '../report-groups.model';

@Component({
  selector: 'app-report-groups-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './report-groups-list.html',
  styleUrls: ['../../styles/list.css'],
})
export class ReportGroupsListComponent implements OnInit {
  department: ReportGroups[] = [];
  private allDepartments: ReportGroups[] = [];

  filterText = '';
  /**
   * activeFilter: boolean | null
   * - true  => show only active
   * - false => show only inactive (if you later add this)
   * - null  => show all
   */
  activeFilter: boolean | null = true;

  constructor(private reportGroupsService: ReportGroupsService) {}

  ngOnInit() {
    this.reportGroupsService.getDepartments().subscribe({
      next: d => {
        this.allDepartments = d || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching department:', err)
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
    if (!confirm('Delete this report group?')) return;

    this.reportGroupsService.deleteDepartment(id).subscribe({
      next: () => {
        this.allDepartments = this.allDepartments.filter(d => d.rowId !== id);
        this.applyFilters();
      },
      error: err => console.error('Delete failed:', err)
    });
  }

  private applyFilters() {
    const q = this.filterText.toLowerCase().trim();

    this.department = this.allDepartments.filter(d => {
      const matchesActive = this.activeFilter === null ? true : (d.active === this.activeFilter);

      const fields = [
        d.groupName,
        d.employee,
        d.alertEmail,
        d.active !== undefined ? d.active.toString() : '',
      ];
      const matchesQuery = !q || fields.some(f => !!f && String(f).toLowerCase().includes(q));
      return matchesActive && matchesQuery;
    });
  }
}
