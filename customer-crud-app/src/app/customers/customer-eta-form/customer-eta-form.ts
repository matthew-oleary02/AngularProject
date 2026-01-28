import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomerETAService } from '../customer-eta.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CustomerETA } from '../customer-eta.model';
import { CustomerService } from '../customer.service'; // Adjust the path as necessary
import { Customer } from '../customer.model'; // Adjust the path as necessary

@Component({
  selector: 'app-customer-eta-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './customer-eta-form.html',
  styleUrls: ['./customer-eta-form.css']
})
export class CustomerETAFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  custETAId!: number;
  customers: Customer[] = [];

  constructor(
    private fb: FormBuilder,
    private customerETAService: CustomerETAService,
    private router: Router,
    private route: ActivatedRoute,
    private customerService: CustomerService
  ) {}

  /* Initialize the form and load customer ETA data if editing */
  ngOnInit() {
    this.form = this.fb.group({
        customer: ['', Validators.required],
        serviceType: [''],
        etaHours: [''],
        hoursBusDays: ['']
    });

    /* Check if we are in edit mode based on route parameters */
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.custETAId = Number(idParam);
      if (Number.isFinite(this.custETAId) && this.custETAId > 0) {
        this.isEdit = true;
        this.customerETAService.getCustomerEta(this.custETAId).subscribe({
          next: eta => this.form.patchValue(eta),
          error: err => console.error('Error fetching customer ETA:', err)
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

    const customerETA: CustomerETA = {
      rowId: this.custETAId || 0,
      ...this.form.value
    };

    const request = this.isEdit
      ? this.customerETAService.updateCustomerEta(customerETA)
      : this.customerETAService.addCustomerEta(customerETA);

    /* Execute the appropriate request and navigate back to the location list on success */
    request.subscribe({
      next: () => {
        this.router.navigate(['/customers']);
      },
      error: (err: any) => {
        console.error('Error saving customer ETA:', err);
      }
    });
  }

}