import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VendorClassification } from '../models/vendor-classification.model';
import { VendorClassificationService } from '../services/vendor-classification.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { VendorService } from '../vendors.service';
import { Vendor } from '../vendors.model';

@Component({
  selector: 'app-vendor-classification-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './vendor-classification-form.html',
  styleUrls: ['../../styles/form.css'],
})
export class VendorClassificationFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  classificationId!: number;
  vendors: Vendor[] = [];

  constructor(
    private fb: FormBuilder,
    private classificationService: VendorClassificationService,
    private router: Router,
    private route: ActivatedRoute,
    private vendorService: VendorService
  ) {}

  /* Initialize the form and load vendor classification data if editing */
  ngOnInit() {
    this.form = this.fb.group({
        vendorId: ['', Validators.required],
        classification: ['', Validators.required]
    });

    /* Check if we are in edit mode based on route parameters */
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.classificationId = Number(idParam);
      if (Number.isFinite(this.classificationId) && this.classificationId > 0) {
        this.isEdit = true;
        this.classificationService.getClassification(this.classificationId).subscribe({
          next: c => this.form.patchValue(c),
          error: err => console.error('Error fetching vendor classification:', err)
        });
      }
    }

    /* Load vendor list for the dropdown */
    this.vendorService.getVendors().subscribe({
      next: vendors => this.vendors = vendors,
      error: err => console.error('Error fetching vendors:', err)
    });
  }

  /* Handle form submission for add or edit */
  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const classificationData: VendorClassification = {
      rowId: this.classificationId || 0,
      ...this.form.value,
      // Audit fields will be handled by backend usually, but we include them if needed
      createdOn: new Date(),
      createdBy: 'System', 
      modifiedOn: new Date(),
      modifiedBy: 'System'
    };

    const request = this.isEdit
      ? this.classificationService.updateClassification(classificationData)
      : this.classificationService.addClassification(classificationData);

    /* Execute the appropriate request and navigate back to the vendor list on success */
    request.subscribe({
      next: () => {
        this.router.navigate(['/vendors']);
      },
      error: (err: any) => {
        console.error('Error saving vendor classification:', err);
      }
    });
  }
}
