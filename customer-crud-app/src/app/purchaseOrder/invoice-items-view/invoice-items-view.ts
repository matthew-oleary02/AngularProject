//invoice-items-view.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { InvoiceItem } from '../invoice-items.model';
import { InvoiceItemService } from '../invoice-items.service';

@Component({
    selector: 'app-invoice-items-view',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './invoice-items-view.html',
    styleUrls: ['../../styles/view.css'],
})
export class InvoiceItemsViewComponent implements OnInit {
    ii?: InvoiceItem;

    constructor(
        private invoiceItemService: InvoiceItemService,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit() {
        const idParam = this.route.snapshot.paramMap.get('id');
        const id = idParam ? Number(idParam) : NaN;
        if (!Number.isFinite(id) || id <= 0) {
            console.error('Invalid invoice item ID', idParam);
        }

        this.invoiceItemService.getInvoiceItem(id).subscribe({
            next: ii => this.ii = ii,
            error: err => console.error('Error fetching invoice item:', err)
        });
    }
}