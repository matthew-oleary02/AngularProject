// resource-productivity-list.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ResourceProductivity } from '../resource-productivity.model';
import { ResourceProductivityService } from '../resource-productivity.service';

@Component({
    selector: 'app-resource-productivity-list',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './resource-productivity-list.html',
    styleUrls: ['../../styles/list.css'],
})

export class ResourceProductivityListComponent implements OnInit {
    resourceProductivity: ResourceProductivity[] = [];
    private allResourceProductivity: ResourceProductivity[] = [];

    filterText = '';
        /**
         * activeFilter: boolean | null
         * - true  => show only active
         * - false => show only inactive (if you later add this)
         * - null  => show all
         * */

    constructor(private resourceProductivityService: ResourceProductivityService) {}

    ngOnInit() {
        this.resourceProductivityService.getResourceProductivity().subscribe({
            next: rp => {
                this.allResourceProductivity = rp || [];
                this.applyFilters();
            },
            error: err => console.error('Error fetching resource productivity:', err)
        });
    }

    onFilterChange(query: string) {
        this.filterText = query || '';
        this.applyFilters();
    }

    clearFilter() {
        this.filterText = '';
        this.applyFilters();
    }

    onDelete(id: number) {
        if (!id) return;
        if (!confirm('Delete this resource productivity record?')) return;
        
        this.resourceProductivityService.deleteResourceProductivity(id).subscribe({
            next: () => {
                // Remove the deleted record from the local list
                this.allResourceProductivity = this.allResourceProductivity.filter(rp => rp.rowId !== id);
                this.applyFilters();
            },
            error: err => console.error('Error deleting resource productivity record:', err)
        });
    }

    private applyFilters() {
        const q = this.filterText.toLowerCase().trim();

        this.resourceProductivity = this.allResourceProductivity.filter(rp => {
            const matchesText = !q || rp.employee.toLowerCase().includes(q);

            const fields = [
                rp.employee,
                rp.productivityRate.toString(),
                rp.variance.toString(),
            ];
            const matchesQuery = !q || fields.some(f => !!f && String(f).toLowerCase().includes(q));
            return matchesQuery;
        });
    }
}

