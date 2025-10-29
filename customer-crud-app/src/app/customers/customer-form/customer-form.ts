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
      address1: [''], address2: [''], city: [''], state: [''], zip: [''], country: [''],
      primaryContactName: [''], primaryContactPhone: [''], primaryContactEmail: [''],
      accountingSystemName: [''], active: [true], customerNote: ['']
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

    if(this.isEdit) {
      this.customerService.getCustomer(this.customerId).subscribe(c => {
        if(c) this.form.patchValue({
          customerName: c.customerName,
          address1: c.billingAddress.address1,
          address2: c.billingAddress.address2,
          city: c.billingAddress.city,
          state: c.billingAddress.state,
          zip: c.billingAddress.zip,
          country: c.billingAddress.country,
          primaryContactName: c.primaryContact.name,
          primaryContactPhone: c.primaryContact.phone,
          primaryContactEmail: c.primaryContact.email,
          accountingSystemName: c.accountingSystemName,
          active: c.active,
          customerNote: c.customerNote
        });
      });
    }
  }

  submit() {

    if (this.isDelete) {
      if (Number.isFinite(this.customerId) && this.customerId > 0) {
        this.customerService.deleteCustomer(this.customerId);
      }
      this.router.navigate(['/customers']);
      return;
    }

    const customer: Customer = {
      rowId: this.customerId || 0,
      customerName: this.form.value.customerName,
      billingAddress: {
        address1: this.form.value.address1,
        address2: this.form.value.address2,
        city: this.form.value.city,
        state: this.form.value.state,
        zip: this.form.value.zip,
        country: this.form.value.country,
        email: this.form.value.primaryContactEmail
      },
      primaryContact: {
        name: this.form.value.primaryContactName,
        phone: this.form.value.primaryContactPhone,
        email: this.form.value.primaryContactEmail
      },
      accountingSystemName: this.form.value.accountingSystemName,
      active: this.form.value.active,
      customerNote: this.form.value.customerNote
    };

    if (this.isEdit) {
      this.customerService.updateCustomer(customer);
    } else {
      this.customerService.addCustomer(customer);
    }

    this.router.navigate(['/customers']);
  }
}