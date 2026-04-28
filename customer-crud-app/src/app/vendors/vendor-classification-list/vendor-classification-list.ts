import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VendorClassificationService } from '../services/vendor-classification.service';
import { VendorClassification } from '../models/vendor-classification.model';

@Component({
  selector: 'app-vendor-classification-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vendor-classification-list.html',
  styleUrls: ['../../styles/list.css'],
})
export class VendorClassificationListComponent implements OnInit {
  @Input() vendorId: number | null = null;
  classifications: VendorClassification[] = [];
  private allClassifications: VendorClassification[] = [];
  filterText = '';

  constructor(private classificationService: VendorClassificationService) {}

  ngOnInit() {
    this.classificationService.getClassifications().subscribe({
      next: data => {
        this.allClassifications = data || [];
        this.applyFilters();
      },
      error: err => console.error('Error fetching vendor classifications:', err)
    });
  }

  onFilterChange(query: string) {
    this.filterText = query || '';
    this.applyFilters();
  }

  private applyFilters() {
    const q = this.filterText.toLowerCase().trim();

    this.classifications = this.allClassifications.filter(c => {
      // Filter by vendorId if provided
      const matchesVendor = this.vendorId === null ? true : (c.vendorId === this.vendorId);
      
      const fields = [
        c.classification,
        c.createdBy,
        c.modifiedBy
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
    if (!confirm(`Delete vendor classification #${id}?`)) return;

    this.classificationService.deleteClassification(id).subscribe({
      next: () => {
        this.classifications = this.classifications.filter(c => c.rowId !== id);
      },
      error: (err) => {
        console.error('Error deleting vendor classification:', err);
        alert('Failed to delete vendor classification. Please try again.');
      }
    });
  }
}
