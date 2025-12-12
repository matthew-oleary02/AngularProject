/* vendor-form.ts - Angular component for vendor add/edit form */

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Vendor } from '../vendors.model';
import { VendorService } from '../vendors.service';

@Component({
  selector: 'app-vendor-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './vendors-form.html',
  styleUrls: ['./vendors-form.css']
})
export class VendorsFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  vendorId!: number;

  constructor(
    private fb: FormBuilder,
    private vendorService: VendorService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /* Initialize the form and load vendor data if editing */
  ngOnInit() {
    this.form = this.fb.group({
      vendorName: ['', Validators.required],
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
      status: [''],
      statusNote: ['']
    });

    /* Check if we are in edit mode based on route parameters */
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.vendorId = Number(idParam);
      if (Number.isFinite(this.vendorId) && this.vendorId > 0) {
        this.isEdit = true;
      }
    }

    /* If editing, load the vendor data into the form */
    if (this.isEdit) {
      this.vendorService.getVendor(this.vendorId).subscribe(c => {
        if (c) this.form.patchValue(c);
      });
    }
  }

  /* Handle form submission for add or edit */
  submit() {
    // If not delete action, prevent submission when the form is invalid
    if (this.form.invalid) {
      // mark controls so validation messages appear
      this.form.markAllAsTouched();
      return;
    }

    const vendor: Vendor = {
      rowId: this.vendorId || 0,
      ...this.form.value
    };

    const request = this.isEdit
      ? this.vendorService.updateVendor(vendor)
      : this.vendorService.addVendor(vendor);

    /* Execute the appropriate request and navigate back to the vendor list on success */
    request.subscribe({
      next: () => {
        this.router.navigate(['/vendors']);
      },
      error: err => {
        console.error('Error saving vendor:', err);
      }
    });
  }

}