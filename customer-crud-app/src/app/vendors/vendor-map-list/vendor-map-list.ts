import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VendorMap } from '../vendor-map.model';
import { VendorMapService } from '../vendor-map.service';

@Component({
  selector: 'app-vendor-map-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vendor-map-list.html',
  styleUrls: ['../../styles/list.css']
})
export class VendorMapListComponent implements OnInit {
  @Input() vendorId: number | null = null;
  vendorMaps: VendorMap[] = [];
  private allVendorMaps: VendorMap[] = [];
  filterText = '';

  constructor(private vendorMapService: VendorMapService) { }

  ngOnInit() {
    this.vendorMapService.getVendorMaps().subscribe({
      next: vm => {
        this.allVendorMaps = vm || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching vendor maps:', err)
    });
  }

  onFilterChange(query: string) {
    this.filterText = query || '';
    this.applyFilters();
  }

  applyFilters() {
    const q = this.filterText.toLowerCase().trim();
    this.vendorMaps = this.allVendorMaps.filter(vm => {
      const fields = [
        vm.vendorId,
        vm.vendorName,
        vm.vendorCoverageId,
        vm.coordinates
      ];
      const matchesVendor = this.vendorId === null ? true : (vm.vendorId === this.vendorId);
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
    if (!confirm(`Delete vendor map #${id}?`)) return;

    this.vendorMapService.deleteVendorMap(id).subscribe({
      next: () => {
        this.vendorMaps = this.vendorMaps.filter(vm => vm.rowId !== id);
      },
      error: err => {
        console.error('Error deleting vendor map:', err);
        alert('Failed to delete vendor map. Please try again.');
      }
    });
  }
}
