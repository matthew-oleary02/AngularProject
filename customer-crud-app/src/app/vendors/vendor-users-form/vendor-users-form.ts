import { Component, OnInit} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VendorUsersService } from '../services/vendor-users.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { VendorUsers } from '../models/vendor-users.model';
import { VendorService } from '../vendors.service';
import { Vendor } from '../vendors.model';

@Component({
    selector: 'app-vendor-users-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './vendor-users-form.html',
    styleUrls: ['../../styles/form.css'],
})

export class VendorUsersFormComponent implements OnInit {
    form!: FormGroup;
    isEdit = false;
    vendorUserId!: number;
    vendorId?: number;
    vendors: Vendor[] = [];

    constructor(
        private fb: FormBuilder,
        private vendorUsersService: VendorUsersService,
        private router: Router,
        private route: ActivatedRoute,
        private vendorService: VendorService
    ) {}

    /* Initialize the form and load vendor user data if editing */
    ngOnInit() {
        this.form = this.fb.group({
            vendor: ['', Validators.required],
            username: ['', Validators.required],
            email: [''],
            phone: [''],
            trade: [''],
            active: [true]
        });

        // Check for vendor context in query params
        this.route.queryParams.subscribe(params => {
            if (params['vendorId']) {
                this.vendorId = Number(params['vendorId']);
            }
            if (params['vendorName']) {
                this.form.patchValue({ vendor: params['vendorName'] });
            }
        });

        /* Check if we are in edit mode based on route parameters */
        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            this.vendorUserId = Number(idParam);
            if (Number.isFinite(this.vendorUserId) && this.vendorUserId > 0) {
                this.isEdit = true;
                this.vendorUsersService.getVendorUser(this.vendorUserId).subscribe({
                    next: user => this.form.patchValue(user),
                    error: err => console.error('Error fetching vendor user:', err)
                });
            }
        }

        /* Load vendor list for the dropdown */
        this.vendorService.getVendors().subscribe({
            next: vendors => this.vendors = vendors,
            error: err => console.error('Error fetching vendors:', err)
        });
    }

    /* Handle form submission for creating or updating vendor users */
    submit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        const vendorUser: VendorUsers = {
            rowId: this.vendorUserId || 0,
            ...this.form.value
        };
        
        const request = this.isEdit
            ? this.vendorUsersService.updateVendorUser(vendorUser)
            : this.vendorUsersService.addVendorUser(vendorUser);

        request.subscribe({
            next: () => {
                this.goBack();
            },
            error: err => {
                console.error('Error saving vendor user:', err);
            }
        });
    }

    cancel() {
        this.goBack();
    }

    private goBack() {
        if (this.vendorId) {
            this.router.navigate(['/vendors', this.vendorId], { queryParams: { tab: 'vendorUsers' } });
        } else {
            this.router.navigate(['/vendors']);
        }
    }
}
