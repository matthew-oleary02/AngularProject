// invoice-items-list.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InvoiceItem } from '../invoice-items.model';
import { InvoiceItemService } from '../invoice-items.service';

@Component({
    selector: 'app-invoice-items-list',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './invoice-items-list.html',
    styleUrls: ['../../styles/list.css']
})
export class InvoiceItemsListComponent implements OnInit {
    invoiceItems: InvoiceItem[] = [];

    constructor(private invoiceItemService: InvoiceItemService) { }

    ngOnInit() {
        this.loadInvoiceItems();
    }

    loadInvoiceItems(): void {
        this.invoiceItemService.getInvoiceItems().subscribe(invoiceItems => {
            this.invoiceItems = invoiceItems;
        });
    }

    deleteInvoiceItem(id: number): void {
        if (confirm('Are you sure you want to delete this invoice item?')) {
            this.invoiceItemService.deleteInvoiceItem(id).subscribe(() => {
                this.loadInvoiceItems();
            });
        }
    }
}