import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomerService } from '../customer.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Customer } from '../customer.model';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './customer-form.html',
  styleUrls: ['./customer-form.css']
})
export class CustomerFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  isDelete = false;
  customerId!: number;

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      customerName: ['', Validators.required],
      billingAddress: this.fb.group({
        address1: [''],
        address2: [''],
        city: [''],
        state: [''],
        zip: [''],
        county: [''],
        country: [''],
        email: ['']
      }),
      primaryContact: this.fb.group({
        name: [''],
        phone: [''],
        email: ['']
      }),
      accountingSystemName: [''],
      active: [true],
      customerNote: ['']
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.customerId = Number(idParam);
      if (Number.isFinite(this.customerId) && this.customerId > 0) {
        this.isEdit = true;
      }
    }

    const firstSegment = this.route.snapshot.url[0]?.path;
    if (firstSegment === 'delete' || this.route.snapshot.routeConfig?.path?.includes('delete')) {
      this.isDelete = true;
    }

    if (this.isEdit) {
      this.customerService.getCustomer(this.customerId).subscribe(c => {
        if (c) this.form.patchValue(c);
      });
    }
  }

  submit() {
    // If not delete action, prevent submission when the form is invalid
    if (!this.isDelete && this.form.invalid) {
      // mark controls so validation messages appear
      this.form.markAllAsTouched();
      return;
    }

    if (this.isDelete) {
      if (Number.isFinite(this.customerId) && this.customerId > 0) {
        this.customerService.deleteCustomer(this.customerId).subscribe(() => {
          this.router.navigate(['/customers']);
        }, err => {
          console.error('Error deleting customer:', err);
        });
      }
      return;
    }

    const customer: Customer = {
      rowId: this.customerId || 0,
      ...this.form.value
    };

    const request = this.isEdit
      ? this.customerService.updateCustomer(customer)
      : this.customerService.addCustomer(customer);

    request.subscribe({
      next: () => {
        this.router.navigate(['/customers']);
      },
      error: err => {
        console.error('Error saving customer:', err);
      }
    });
  }

}