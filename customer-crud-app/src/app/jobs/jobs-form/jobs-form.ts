// jobs-form.ts - Component for creating and editing job records
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LocationService } from '../../customers/location.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Location } from '../../customers/location.model';
import { CustomerService } from '../../customers/customer.service';
import { Customer } from '../../customers/customer.model';
import { JobsService } from '../jobs.service';
import { Jobs } from '../jobs.model';

@Component({
  selector: 'app-jobs-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './jobs-form.html',
  styleUrls: ['./jobs-form.css']
})
export class JobsFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  jobId!: number;
  customers: Customer[] = [];
  locations: Location[] = [];

  constructor(
    private fb: FormBuilder,
    private locationService: LocationService,
    private router: Router,
    private route: ActivatedRoute,
    private customerService: CustomerService,
    private jobsService: JobsService
  ) {}

    /* Initialize the form and load job data if editing */
    ngOnInit() {
    this.form = this.fb.group({
        customer: ['', Validators.required],
        location: ['', Validators.required],
        jobNumber: ['', Validators.required],
        clientTrackingNumber: [''],
        serviceType: [''],
        jobStatus: [''],
        trade: [''],
        vendor: [''],
        jobOwner: [''],
        dateReceived: [''],
        state: [''],
        eta: [''],
        caller: [''],
        nte: [''],
        vendorNTE: [''],
        quote: [''],
        jobNote: [''],
        active: [true]
    });

    /* Load customers and locations for dropdowns */
    this.customerService.getCustomers().subscribe({
        next: cust => this.customers = cust || [],
        error: err => console.error('Error fetching customers:', err)
    });
    this.locationService.getLocations().subscribe({
        next: loc => this.locations = loc || [],
        error: err => console.error('Error fetching locations:', err)
    });

    /* Check if we are in edit mode based on route parameters */
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
        this.jobId = Number(idParam);
        if (Number.isFinite(this.jobId) && this.jobId > 0) {
        this.isEdit = true;
        }
    }
    
    /* If editing, load the job data into the form */
    if (this.isEdit) {
        this.jobsService.getJob(this.jobId).subscribe({
        next: job => {
            if (job) this.form.patchValue(job);
        },
        error: err => console.error('Error fetching job:', err)
        });
    }
    }

    /* Handle form submission for both create and update */
    submit() {
    if (this.form.invalid) {
        return;
    }
    
    const jobData: Jobs = {
        ...this.form.value,
        rowId: this.jobId || 0
    };

    const request = this.isEdit
        ? this.jobsService.updateJob(jobData)
        : this.jobsService.addJob(jobData);

    request.subscribe({
        next: () => this.router.navigate(['/jobs']),
        error: err => console.error('Error saving job:', err)
    });
    }
}
