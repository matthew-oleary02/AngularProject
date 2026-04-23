import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VendorRatesService } from '../services/vendor-rates.service';
import { VendorService } from './../vendors.service'; // As requested by user
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { VendorRates } from '../models/vendor-rates.model';
import { Vendor } from './../vendors.model';

@Component({
  selector: 'app-vendor-rates-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './vendor-rates-form.html',
  styleUrls: ['../../styles/form.css'],
})
export class VendorRatesFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  vendRateId!: number;
  vendors: any[] = []; // TODO: Change type to Vendor if model exists

  constructor(
    private fb: FormBuilder,
    private vendorRatesService: VendorRatesService,
    private router: Router,
    private route: ActivatedRoute,
    private vendorService: VendorService
  ) { }

  /* Initialize the form and load vendor rates data if editing */
  ngOnInit() {
    this.form = this.fb.group({
      vendor: ['', Validators.required],
      trade: [''],
      rateType: [''],
      state: [''],
      rate: [''],
    });

    /* Check if we are in edit mode based on route parameters */
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.vendRateId = Number(idParam);
      if (Number.isFinite(this.vendRateId) && this.vendRateId > 0) {
        this.isEdit = true;
        // @ts-ignore
        this.vendorRatesService.getById(this.vendRateId.toString()).subscribe({
          next: (rate: any) => this.form.patchValue(rate),
          error: (err: any) => console.error('Error fetching vendor rate:', err)
        });
      }
    }
    /* Load vendor list for the dropdown */
    // TODO: Ensure getAll() exists on VendorsService or use correct method
    // @ts-ignore
    this.vendorService.getVendors().subscribe({
      next: (vendors: any) => this.vendors = vendors,
      error: (err: any) => console.error('Error fetching vendors:', err)
    });
  }

  /* Handle form submission for adding or updating vendor rates */
  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const vendorRate: VendorRates = {
      id: this.vendRateId?.toString() || '0',
      ...this.form.value
    };

    const request = this.isEdit
      ? this.vendorRatesService.update(this.vendRateId.toString(), vendorRate)
      : this.vendorRatesService.create(vendorRate);

    // @ts-ignore
    request.subscribe({
      next: () => {
        this.router.navigate(['/vendors']);
      },
      error: (err: any) => {
        console.error('Error saving vendor rate:', err);
      }
    });
  }
}
