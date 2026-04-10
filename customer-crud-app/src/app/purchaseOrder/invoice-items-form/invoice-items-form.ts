// invoice-items-form.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InvoiceItem } from '../invoice-items.model';
import { InvoiceItemService } from '../invoice-items.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-invoice-items-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './invoice-items-form.html',
    styleUrls: ['../../styles/form.css']
})
export class InvoiceItemsFormComponent implements OnInit {
    form!: FormGroup;
    isEdit = false;
    invoiceItemId!: number;

    constructor(
        private fb: FormBuilder,
        private invoiceItemService: InvoiceItemService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit() {
        this.form = this.fb.group({
            serviceRequestId: ['', Validators.required],
            category: ['', Validators.required],
            description: ['', Validators.required],
            total: ['', Validators.required],
            saleTaxTotal: ['', Validators.required],
            quantity: ['', Validators.required],
            rate: ['', Validators.required],
            createdOn: ['', Validators.required],
            createdBy: ['', Validators.required],
            modifiedOn: ['', Validators.required],
            modifiedBy: ['', Validators.required]
        });

        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            this.invoiceItemId = Number(idParam);
            if (Number.isFinite(this.invoiceItemId) && this.invoiceItemId > 0) {
                this.isEdit = true;
            }
        }

        if (this.isEdit) {
            this.invoiceItemService.getInvoiceItem(this.invoiceItemId).subscribe(invoiceItem => {
                this.form.patchValue(invoiceItem);
            });
        }
    }

    submit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const invoiceItem: InvoiceItem = {
            rowId: this.invoiceItemId || 0,
            ...this.form.value
        };

        const request = this.isEdit
            ? this.invoiceItemService.updateInvoiceItem(invoiceItem)
            : this.invoiceItemService.addInvoiceItem(invoiceItem);

        request.subscribe({
            next: () => {
                this.router.navigate(['/invoice-items']);
            },
            error: err => {
                console.error('Error saving invoice item:', err);
            }
        });
    }
}