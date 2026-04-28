import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VendorContractStatusService } from '../services/vendor-contract-status.service';
import { VendorContractStatus } from '../models/vendor-contract-status.model';

@Component({
  selector: 'app-vendor-contract-status-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vendor-contract-status-list.html',
  styleUrls: ['../../styles/list.css'],
})
export class VendorContractStatusListComponent implements OnInit {
  @Input() vendorId: number | null = null;
  statuses: VendorContractStatus[] = [];
  private allStatuses: VendorContractStatus[] = [];
  filterText = '';

  constructor(private statusService: VendorContractStatusService) {}

  ngOnInit() {
    this.statusService.getContractStatuses().subscribe({
      next: data => {
        this.allStatuses = data || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching vendor contract statuses:', err)
    });
  }

  onFilterChange(query: string) {
    this.filterText = query || '';
    this.applyFilters();
  }

  private applyFilters() {
    const q = this.filterText.toLowerCase().trim();

    this.statuses = this.allStatuses.filter(s => {
      // Filter by vendorId if provided
      const matchesVendor = this.vendorId === null ? true : (s.vendorId === this.vendorId);
      
      const fields = [
        s.status,
        s.createdBy,
        s.modifiedBy
      ];
      const matchesQuery = !q || fields.some(f => !!f && String(f).toLowerCase().includes(q));
      
      return matchesVendor && matchesQuery;
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
