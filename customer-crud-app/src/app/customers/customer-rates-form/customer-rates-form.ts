import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomerRatesService } from '../customer-rates.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CustomerRates } from '../customer-rates.model';
import { CustomerService } from '../customer.service'; // Adjust the path as necessary
import { Customer } from '../customer.model'; // Adjust the path as necessary

@Component({
    selector: 'app-customer-rates-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './customer-rates-form.html',
  styleUrls: ['../../styles/form.css'],
})

export class CustomerRatesFormComponent implements OnInit {
    form!: FormGroup;
    isEdit = false;
    custRateId!: number;
    customers: Customer[] = [];
    constructor(
        private fb: FormBuilder,
        private customerRatesService: CustomerRatesService,
        private router: Router,
        private route: ActivatedRoute,
        private customerService: CustomerService
    ) {}
    /* Initialize the form and load customer rates data if editing */
    ngOnInit() {
        this.form = this.fb.group({
            customer: ['', Validators.required],
            trade: [''],
            rateType: [''],
            state: [''],
            rate: [''],
        });

        /* Check if we are in edit mode based on route parameters */
        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            this.custRateId = Number(idParam);
            if (Number.isFinite(this.custRateId) && this.custRateId > 0) {
                this.isEdit = true;
                this.customerRatesService.getCustomerRate(this.custRateId).subscribe({
                    next: rate => this.form.patchValue(rate),
                    error: err => console.error('Error fetching customer rate:', err)
                });
            }
        }
        /* Load customer list for the dropdown */
        this.customerService.getCustomers().subscribe({
            next: customers => this.customers = customers,
            error: err => console.error('Error fetching customers:', err)
        });
    }

    /* Handle form submission for adding or updating customer rates */
    onSubmit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        
        const customerRate: CustomerRates = {
            rowId: this.custRateId || 0,
            ...this.form.value
        };

        const request = this.isEdit
            ? this.customerRatesService.updateCustomerRate(customerRate)
            : this.customerRatesService.addCustomerRate(customerRate);

        request.subscribe({
            next: () => {
                this.router.navigate(['/customers']);
            },
            error: (err: any) => {
                console.error('Error saving customer rate:', err);
            }
        });
    }
}
