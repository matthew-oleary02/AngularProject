import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServiceTypes } from '../service-types.model';
import { ServiceTypesService } from '../service-types.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../customer.service';
import { Customer } from '../customer.model';

@Component({
  selector: 'app-service-types-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './service-types-form.html',
  styleUrls: ['../../styles/form.css'],
})
export class ServiceTypesFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  serviceTypeId!: number;
  customers: Customer[] = [];

  constructor(
    private fb: FormBuilder,
    private serviceTypesService: ServiceTypesService,
    private router: Router,
    private route: ActivatedRoute,
    private customerService: CustomerService
  ) {}

  /* Initialize the form and load customer service type data if editing */
  ngOnInit() {
    this.form = this.fb.group({
        customer: ['', Validators.required],
        serviceType: ['']
    });

    /* Check if we are in edit mode based on route parameters */
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.serviceTypeId = Number(idParam);
      if (Number.isFinite(this.serviceTypeId) && this.serviceTypeId > 0) {
        this.isEdit = true;
        this.serviceTypesService.getServiceType(this.serviceTypeId).subscribe({
          next: st => this.form.patchValue(st),
          error: err => console.error('Error fetching customer service type:', err)
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

    const serviceTypes: ServiceTypes = {
      rowId: this.serviceTypeId || 0,
      ...this.form.value
    };

    const request = this.isEdit
      ? this.serviceTypesService.updateServiceType(serviceTypes)
      : this.serviceTypesService.addServiceType(serviceTypes);

    /* Execute the appropriate request and navigate back to the customer list on success */
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