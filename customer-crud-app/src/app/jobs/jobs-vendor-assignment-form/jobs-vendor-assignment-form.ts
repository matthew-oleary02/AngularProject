import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { JobsVendorAssignmentService } from '../jobs-vendor-assignment.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { JobsVendorAssignment } from '../jobs-vendor-assignment.model';
import { JobService } from '../jobs.service';
import { Job } from '../jobs.model';

@Component({
  selector: 'app-jobs-vendor-assignment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './jobs-vendor-assignment-form.html',
  styleUrls: ['../../styles/form.css'],
})
export class JobsVendorAssignmentFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  statusId!: number;
  jobs: Job[] = [];

  constructor(
    private fb: FormBuilder,
    private statusService: JobsVendorAssignmentService,
    private router: Router,
    private route: ActivatedRoute,
    private jobService: JobService
  ) {}

  /* Initialize the form and load status data if editing */
  ngOnInit() {
    this.form = this.fb.group({
        jobId: ['', Validators.required],
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
          error: err => console.error('Error fetching job contract status:', err)
        });
      }
    }

    this.loadJobs();
  }

  loadJobs(): void {
    this.jobService.getJobs().subscribe((data: Job[]) => {
      this.jobs = data;
    });
  }

  /* Handle form submission for add or edit */
  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const statusData: JobsVendorAssignment = {
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

    /* Execute the appropriate request and navigate back to the job list on success */
    request.subscribe({
      next: () => {
        this.router.navigate(['/jobs']);
      },
      error: err => {
        console.error('Error saving job contract status:', err);
      }
    });
  }
}
