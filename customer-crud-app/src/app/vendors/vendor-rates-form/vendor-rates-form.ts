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
  vendorId?: number;
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
      vendorName: ['', Validators.required],
      trade: [''],
      rateType: [''],
      state: [''],
      rate: [''],
    });

    // Check for vendor context in query params
    this.route.queryParams.subscribe(params => {
      if (params['vendorId']) {
        this.vendorId = Number(params['vendorId']);
      }
      if (params['vendorName']) {
        this.form.patchValue({ vendorName: params['vendorName'] });
      }
    });

    /* Check if we are in edit mode based on route parameters */
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.vendRateId = Number(idParam);
      if (Number.isFinite(this.vendRateId) && this.vendRateId > 0) {
        this.isEdit = true;
        this.vendorRatesService.getVendorRateById(this.vendRateId).subscribe({
          next: (rate: any) => this.form.patchValue(rate),
          error: (err: any) => console.error('Error fetching vendor rate:', err)
        });
      }
    }
    /* Load vendor list for the dropdown */
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

    const vendorRate: any = {
      rowId: this.vendRateId || 0,
      ...this.form.value
    };

    const request = this.isEdit
      ? this.vendorRatesService.updateVendorRate(this.vendRateId, vendorRate)
      : this.vendorRatesService.addVendorRate(vendorRate);

    request.subscribe({
      next: () => {
        this.goBack();
      },
      error: (err: any) => {
        console.error('Error saving vendor rate:', err);
      }
    });
  }

  cancel() {
    this.goBack();
  }

  private goBack() {
    if (this.vendorId) {
      this.router.navigate(['/vendors', this.vendorId], { queryParams: { tab: 'vendorRates' } });
    } else {
      this.router.navigate(['/vendors']);
    }
  }
}
