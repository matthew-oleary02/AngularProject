import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CustomerRates } from '../customer-rates.model';
import { CustomerRatesService } from '../customer-rates.service';

@Component({
    selector: 'app-customer-rates-view',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './customer-rates-view.html',
    styleUrls: ['./customer-rates-view.css']
})

export class CustomerRatesViewComponent implements OnInit {
    rate?: CustomerRates;
    constructor(private customerRatesService: CustomerRatesService,
        private router: Router,
        private route: ActivatedRoute
    ) {}
    /* Load customer rates details based on route parameter */
    ngOnInit() {
        const idParam = this.route.snapshot.paramMap.get('id');
        const id = idParam ? Number(idParam) : NaN;
        if (!Number.isFinite(id) || id <= 0) {
            console.error('Invalid customer rate ID', idParam);
        };

        /* Fetch customer rate details from the service */
        this.customerRatesService.getCustomerRate(id).subscribe({
            next: rate => this.rate = rate,
            error: err => console.error('Error fetching customer rate:', err)
        });
    }
}