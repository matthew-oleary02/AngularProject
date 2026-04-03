import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { VendorCoverageService } from '../vendor-coverage.service';
import { VendorCoverage } from '../vendor-coverage.model';

@Component({
    selector: 'app-vendor-coverage-view',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './vendor-coverage-view.html',
    styleUrls: ['../../styles/view.css'],
})

export class VendorCoverageViewComponent implements OnInit {
    coverage?: VendorCoverage;

    constructor(private coverageService: VendorCoverageService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    /* Load vendor coverage details based on route parameter */
    ngOnInit() {
        const idParam = this.route.snapshot.paramMap.get('id');
        const id = idParam ? Number(idParam) : NaN;
        if (!Number.isFinite(id) || id <= 0) {
            console.error('Invalid vendor coverage ID', idParam);
        };

        /* Fetch vendor coverage details from the service */
        this.coverageService.getVendorCoverageById(id).subscribe({
            next: c => this.coverage = c,
            error: err => console.error('Error fetching vendor coverage:', err)
        });
    }
}