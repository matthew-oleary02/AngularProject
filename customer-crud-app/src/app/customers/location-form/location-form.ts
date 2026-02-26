import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LocationService } from '../location.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Location } from '../location.model';
import { CustomerService } from '../customer.service';
import { Customer } from '../customer.model';

@Component({
  selector: 'app-location-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './location-form.html',
  styleUrls: ['../../styles/form.css'],
})
export class LocationFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  locationId!: number;
  customers: Customer[] = [];

  constructor(
    private fb: FormBuilder,
    private locationService: LocationService,
    private router: Router,
    private route: ActivatedRoute,
    private customerService: CustomerService
  ) {}

  /* Initialize the form and load location data if editing */
  ngOnInit() {
    this.form = this.fb.group({
        customer: ['', Validators.required],
        storeNumber: ['', Validators.required],
        siteAddress: this.fb.group({
            address1: ['', [Validators.required, Validators.maxLength(200)]],
            address2: [''],
            city: ['', Validators.required],
            state: ['', Validators.required],
            zip: ['', Validators.required],
            county: [''],
            country: ['', Validators.required]
        }),
        primaryContact: this.fb.group({
            firstName: [''],
            lastName: [''],
            phone: [''],
            email: ['']
        }),
        siteNote: [''],
        active: [true]
    });

    /* Check if we are in edit mode based on route parameters */
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.locationId = Number(idParam);
      if (Number.isFinite(this.locationId) && this.locationId > 0) {
        this.isEdit = true;
      }
    }

    /* If editing, load the location data into the form */
    if (this.isEdit) {
      this.locationService.getLocation(this.locationId).subscribe(c => {
        if (c) this.form.patchValue(c);
      });
    }

    this.loadCustomers();
  }

  loadCustomers(): void {
    this.customerService.getCustomers().subscribe((data: Customer[]) => {
      this.customers = data;
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

    const location: Location = {
      rowId: this.locationId || 0,
      ...this.form.value
    };

    const request = this.isEdit
      ? this.locationService.updateLocation(location)
      : this.locationService.addLocation(location);

    /* Execute the appropriate request and navigate back to the location list on success */
    request.subscribe({
      next: () => {
        this.router.navigate(['/locations']);
      },
      error: err => {
        console.error('Error saving location:', err);
      }
    });
  }

}