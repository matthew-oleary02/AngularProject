import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VendorAssetService } from '../services/vendor-asset.service';
import { VendorAsset } from '../models/vendor-asset.model';

@Component({
  selector: 'app-vendor-asset-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vendor-asset-list.html',
  styleUrls: ['../../styles/list.css'],
})
export class VendorAssetListComponent implements OnInit {
  @Input() vendorId: number | null = null;
  vendorAssets: VendorAsset[] = [];
  private allVendorAssets: VendorAsset[] = [];
  filterText = '';

  constructor(private vendorAssetService: VendorAssetService) {}

  ngOnInit() {
    this.vendorAssetService.getVendorAssets().subscribe({
      next: assets => {
        this.allVendorAssets = assets || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching vendor assets:', err)
    });
  }

  onFilterChange(query: string) {
    this.filterText = query || '';
    this.applyFilters();
  }

  private applyFilters() {
    const q = this.filterText.toLowerCase().trim();

    this.vendorAssets = this.allVendorAssets.filter(asset => {
      // Filter by vendorId if provided
      const matchesVendor = this.vendorId === null ? true : (asset.vendorId === this.vendorId);
      
      const fields = [
        asset.assetName,
        asset.vendorId,
        asset.createdBy,
        asset.modifiedBy
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
    if (!confirm(`Delete vendor asset #${id}?`)) return;

    this.vendorAssetService.deleteVendorAsset(id).subscribe({
      next: () => {
        this.vendorAssets = this.vendorAssets.filter(asset => asset.rowId !== id);
      },
      error: (err) => {
        console.error('Error deleting vendor asset:', err);
        alert('Failed to delete vendor asset. Please try again.');
      }
    });
  }
}
