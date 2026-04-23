import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { VendorRates } from '../models/vendor-rates.model';
import { VendorRatesService } from '../services/vendor-rates.service';

@Component({
    selector: 'app-vendor-rates-view',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './vendor-rates-view.html',
    styleUrls: ['../../styles/view.css'],
})
export class VendorRatesViewComponent implements OnInit {
    rate?: VendorRates | any;
    constructor(private vendorRatesService: VendorRatesService,
        private router: Router,
        private route: ActivatedRoute
    ) {}
    /* Load vendor rates details based on route parameter */
    ngOnInit() {
        const idParam = this.route.snapshot.paramMap.get('id');
        const id = idParam ? Number(idParam) : NaN;
        if (!Number.isFinite(id) || id <= 0) {
            console.error('Invalid vendor rate ID', idParam);
        };

        /* Fetch vendor rate details from the service */
        // @ts-ignore
        this.vendorRatesService.getById(id.toString()).subscribe({
            next: (rate: any) => this.rate = rate,
            error: (err: any) => console.error('Error fetching vendor rate:', err)
        });
    }
}
