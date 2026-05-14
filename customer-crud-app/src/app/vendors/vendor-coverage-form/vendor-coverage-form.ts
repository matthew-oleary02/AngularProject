// vendor-coverage-form.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { VendorCoverage } from '../vendor-coverage.model';
import { VendorCoverageService } from '../vendor-coverage.service';

@Component({
    selector: 'app-vendor-coverage-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './vendor-coverage-form.html',
    styleUrls: ['../../styles/form.css']
})

export class VendorCoverageFormComponent implements OnInit {
    form!: FormGroup;
    isEdit = false;
    coverageId!: number;

    constructor(
        private fb: FormBuilder,
        private coverageService: VendorCoverageService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit() {
        this.form = this.fb.group({
            vendorName: ['', Validators.required],
            status: [''],
            city: [''],
            state: [''],
            zipCode: [''],
            trade: [''],
            rate: [''],
            radius: [''],
            vendorStatus: [''],
            active: [true],
        });

        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            this.coverageId = Number(idParam);
            if (Number.isFinite(this.coverageId) && this.coverageId > 0) {
                this.isEdit = true;
            }
        }

        if (this.isEdit) {
            this.coverageService.getVendorCoverageById(this.coverageId).subscribe(c => {
                if (c) this.form.patchValue(c);
            });
        }
    }

    submit() {
        // If not delete action, prevent submission when the form is invalid
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const coverage: VendorCoverage = {
            rowId: this.coverageId,
            ...this.form.value
        };

        const request = this.isEdit
            ? this.coverageService.updateVendorCoverage(coverage)
            : this.coverageService.addVendorCoverage(coverage);

        request.subscribe({
            next: () => {
                this.router.navigate(['/vendors']);
            },
            error: err => {
                console.error('Error saving vendor coverage:', err)
            }
        });
    }
}