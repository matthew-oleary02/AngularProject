import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { VendorAssetService } from '../services/vendor-asset.service';
import { VendorAsset } from '../models/vendor-asset.model';
import { VendorService } from '../vendors.service';
import { Vendor } from '../vendors.model';

@Component({
    selector: 'app-vendor-asset-form',
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule],
    templateUrl: './vendor-asset-form.html',
    styleUrls: ['../../styles/form.css'],
})
export class VendorAssetFormComponent implements OnInit {
    form!: FormGroup;
    isEdit = false;
    assetId!: number;
    vendors: Vendor[] = [];

    constructor(
        private fb: FormBuilder,
        private vendorAssetService: VendorAssetService,
        private router: Router,
        private route: ActivatedRoute,
        private vendorService: VendorService
    ) {}

    ngOnInit() {
        this.form = this.fb.group({
            vendorId: ['', Validators.required],
            assetName: ['', Validators.required],
            active: [true],
            startTime: [''],
            endTime: [''],
            monthly: [0]
        });

        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            this.assetId = Number(idParam);
            if (Number.isFinite(this.assetId) && this.assetId > 0) {
                this.isEdit = true;
            }
        }

        if (this.isEdit) {
            this.vendorAssetService.getVendorAssetById(this.assetId).subscribe(asset => {
                if (asset) this.form.patchValue(asset);
            });
        }

        this.loadVendors();
    }

    loadVendors(): void {
        this.vendorService.getVendors().subscribe((data: Vendor[]) => {
            this.vendors = data;
        });
    }

    submit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const asset: VendorAsset = {
            rowId: this.assetId || 0,
            ...this.form.value
        };

        const request = this.isEdit
            ? this.vendorAssetService.updateVendorAsset(asset)
            : this.vendorAssetService.addVendorAsset(asset);

        request.subscribe({
            next: () => {
                this.router.navigate(['/vendors/vendor-asset-list']);
            },
            error: err => {
                console.error('Error saving vendor asset:', err);
            }
        });
    }
}
