import { Component, OnInit} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomerCAMsService } from '../customer-cams.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CustomerCAMs } from '../customer-cams.model';
import { CustomerService } from '../customer.service';
import { Customer } from '../customer.model';

@Component({
    selector: 'app-customer-cams-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './customer-cams-form.html',
    styleUrls: ['./customer-cams-form.css']
})

export class CustomerCamsFormComponent implements OnInit {
    form!: FormGroup;
    isEdit = false;
    customerCamsId!: number;
    customers: Customer[] = [];

    constructor(
        private fb: FormBuilder,
        private customerCamsService: CustomerCAMsService,
        private router: Router,
        private route: ActivatedRoute,
        private customerService: CustomerService
    ) {}
    /* Initialize the form and load customer CAMs data if editing */
    ngOnInit() {
        this.form = this.fb.group({
            customer: ['', Validators.required],
            camType: ['', Validators.required],
            camValue: ['', Validators.required],
            effectiveDate: ['', Validators.required],
            expirationDate: [''],
            notes: [''],
            active: [true]
        });
        /* Check if we are in edit mode based on route parameters */
        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            this.customerCamsId = Number(idParam);
            if (Number.isFinite(this.customerCamsId) && this.customerCamsId > 0) {
                this.isEdit = true;
                this.customerCamsService.getCC(this.customerCamsId).subscribe({
                    next: cams => this.form.patchValue(cams),
                    error: err => console.error('Error fetching customer CAMs:', err)
                });
            }
        }
        /* Load customer list for the dropdown */
        this.customerService.getCustomers().subscribe({
            next: customers => this.customers = customers,
            error: err => console.error('Error fetching customers:', err)
        });
    }
    /* Handle form submission for creating or updating customer CAMs */
    onSubmit() {
        if (this.form.invalid) {
            return;
        }
        const customerCams: CustomerCAMs = this.form.value;
        if (this.isEdit) {
            customerCams.rowId = this.customerCamsId;
            this.customerCamsService.updateCC(customerCams).subscribe({
                next: () => this.router.navigate(['/customers', customerCams.customer, 'cams']),
                error: err => console.error('Error updating customer CAMs:', err)
            });
        } else {
            this.customerCamsService.addCC(customerCams).subscribe({
                next: (newCams) => this.router.navigate(['/customers', newCams.customer, 'cams']),
                error: err => console.error('Error creating customer CAMs:', err)
            });
        }
    }
}