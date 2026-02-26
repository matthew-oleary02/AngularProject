import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomerNTEService } from '../customer-nte.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CustomerNTE } from '../customer-nte.model';
import { CustomerService } from '../customer.service'; // Adjust the path as necessary
import { Customer } from '../customer.model'; // Adjust the path as necessary

@Component({
  selector: 'app-customer-nte-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './customer-nte-form.html',
  styleUrls: ['../../styles/form.css'],
})
export class CustomerNTEFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  custNTEId!: number;
  customers: Customer[] = [];

  constructor(
    private fb: FormBuilder,
    private customerNTEService: CustomerNTEService,
    private router: Router,
    private route: ActivatedRoute,
    private customerService: CustomerService
  ) {}

  /* Initialize the form and load customer NTE data if editing */
  ngOnInit() {
    this.form = this.fb.group({
        customer: ['', Validators.required],
        classification: [''],
        serviceType: [''],
        rateNTE: [''],
        vendorNte: [''],
        note: [''],
    });

    /* Check if we are in edit mode based on route parameters */
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.custNTEId = Number(idParam);
      if (Number.isFinite(this.custNTEId) && this.custNTEId > 0) {
        this.isEdit = true;
        this.customerNTEService.getCustomerNte(this.custNTEId).subscribe({
          next: nte => this.form.patchValue(nte),
          error: err => console.error('Error fetching customer NTE:', err)
        });
      }
    }

    /* Load customer list for the dropdown */
    this.customerService.getCustomers().subscribe({
      next: customers => this.customers = customers,
      error: err => console.error('Error fetching customers:', err)
    });
  }

  /* Handle form submission for add or edit */
  submit() {
    // If not delete action, prevent submission when the form is invalid
    if (this.form.invalid) {
      // mark controls so validation messages appear
      this.form.markAllAsTouched();
      return;
    }

    const customerNTE: CustomerNTE = {
      rowId: this.custNTEId || 0,
      ...this.form.value
    };

    const request = this.isEdit
      ? this.customerNTEService.updateCustomerNte(customerNTE)
      : this.customerNTEService.addCustomerNte(customerNTE);

    /* Execute the appropriate request and navigate back to the location list on success */
    request.subscribe({
      next: () => {
        this.router.navigate(['/customers']);
      },
      error: (err: any) => {
        console.error('Error saving customer NTE:', err);
      }
    });
  }

}