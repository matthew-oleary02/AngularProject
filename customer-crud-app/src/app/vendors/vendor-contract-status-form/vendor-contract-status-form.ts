import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VendorContractStatusService } from '../services/vendor-contract-status.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { VendorContractStatus } from '../models/vendor-contract-status.model';
import { VendorService } from '../vendors.service';
import { Vendor } from '../vendors.model';

@Component({
  selector: 'app-vendor-contract-status-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './vendor-contract-status-form.html',
  styleUrls: ['../../styles/form.css'],
})
export class VendorContractStatusFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  statusId!: number;
  vendors: Vendor[] = [];

  constructor(
    private fb: FormBuilder,
    private statusService: VendorContractStatusService,
    private router: Router,
    private route: ActivatedRoute,
    private vendorService: VendorService
  ) {}

  /* Initialize the form and load status data if editing */
  ngOnInit() {
    this.form = this.fb.group({
        vendorId: ['', Validators.required],
        status: ['', Validators.required]
    });

    /* Check if we are in edit mode based on route parameters */
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.statusId = Number(idParam);
      if (Number.isFinite(this.statusId) && this.statusId > 0) {
        this.isEdit = true;
        this.statusService.getContractStatus(this.statusId).subscribe({
          next: data => this.form.patchValue(data),
          error: err => console.error('Error fetching vendor contract status:', err)
        });
      }
    }

    this.loadVendors();
  }

  loadVendors(): void {
    this.vendorService.getVendors().subscribe((data: Vendor[]) => {
      this.vendors = data;
    });
  }

  /* Handle form submission for add or edit */
  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const statusData: VendorContractStatus = {
      rowId: this.statusId || 0,
      ...this.form.value,
      createdOn: new Date(),
      createdBy: 'System', 
      modifiedBy: 'System',
      modifiedOn: new Date()
    };

    const request = this.isEdit
      ? this.statusService.updateContractStatus(statusData)
      : this.statusService.addContractStatus(statusData);

    /* Execute the appropriate request and navigate back to the vendor list on success */
    request.subscribe({
      next: () => {
        this.router.navigate(['/vendors']);
      },
      error: err => {
        console.error('Error saving vendor contract status:', err);
      }
    });
  }
}
