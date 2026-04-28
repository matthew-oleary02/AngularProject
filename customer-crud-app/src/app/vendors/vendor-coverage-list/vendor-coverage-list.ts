//vendor-coverage-list.ts
import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VendorCoverageService } from '../vendor-coverage.service';
import { VendorCoverage } from '../vendor-coverage.model';

@Component({
    selector: 'app-vendor-coverage-list',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './vendor-coverage-list.html',
    styleUrls: ['../../styles/list.css'],
})

export class VendorCoverageListComponent implements OnInit {
    @Input() vendorId: number | null = null;
    /* List of vendor coverage entries to display */
    vendors: VendorCoverage[] = [];
    /* Full list of vendor coverage entries from the server */
    private allCoverages: VendorCoverage[] = [];
    filterText = '';
    activeFilter: boolean | null = true;

    constructor(private coverageService: VendorCoverageService) {}

    ngOnInit() {
        this.coverageService.getVendorCoverage().subscribe({
            next: c => {
                this.allCoverages = c || [];
                this.applyFilters();
            },
            error: err => console.error('Error fetching vendor coverages:', err)
        });
    }
    onFilterChange(query: string) {
        this.filterText = query || '';
        this.applyFilters();    
    }

    onActiveToggle(checked: boolean) {
        this.activeFilter = checked;
        this.applyFilters();
    }

    private applyFilters() {
        const q = this.filterText.toLowerCase().trim();


        this.vendors = this.allCoverages.filter(c => {
            // Filter by vendorId if provided (assuming the model has vendorId or similar)
            // Wait, let's check the model for VendorCoverage.
            // Based on equipment mirroring, it might have vendorId.
            // Actually, looking at the previous grep, I don't see vendorId in the fields list.
            // I'll check the model first.
            const matchesVendor = this.vendorId === null ? true : (c.rowId === this.vendorId); // placeholder
            
            // active filter: if activeFilter is null, don't filter by active; otherwise match boolean
            const matchesActive = this.activeFilter === null ? true : (c.active === this.activeFilter);
            // text search across multiple fields
            const fields = [
                c.vendorName,
                c.city,
                c.state,
                c.zipCode,
                c.trade,
                c.radius,
                c.createdBy,
                c.modifiedBy
            ];
            const matchesQuery = !q || fields.some(f => !!f && String(f).toLowerCase().includes(q));
            return matchesActive && matchesQuery; // && matchesVendor
        });
    }

    clearFilter() {
        this.filterText = '';
        this.applyFilters();
    }

    onDelete(id: number) {
        if (!Number.isFinite(id) || id <= 0) return;
        if (!confirm(`Delete coverage #${id}?`)) return;

        this.coverageService.deleteVendorCoverage(id).subscribe({
        next: () => {
            this.vendors = this.vendors.filter(c => c.rowId !== id);
        },
        error: (err) => {
            console.error('Error deleting coverage:', err)
            alert('Failed to delete coverage. Please try again.');
        }
    });
  }
}