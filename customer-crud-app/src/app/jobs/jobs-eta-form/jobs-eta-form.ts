import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { JobsETAService } from '../jobs-eta.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { JobsETA } from '../jobs-eta.model';
import { JobsService } from '../jobs.service';
import { Jobs } from '../jobs.model'; 

@Component({
  selector: 'app-jobs-eta-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './jobs-eta-form.html',
  styleUrls: ['../../styles/form.css'],
})
export class JobsETAFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  jobETAId!: number;
  jobsList: Jobs[] = [];

  constructor(
    private fb: FormBuilder,
    private jobsETAService: JobsETAService,
    private router: Router,
    private route: ActivatedRoute,
    private jobsService: JobsService
  ) {}

  /* Initialize the form and load job ETA data if editing */
  ngOnInit() {
    this.form = this.fb.group({
        job: ['', Validators.required],
        serviceType: [''],
        etaHours: [''],
        hoursBusDays: ['']
    });

    /* Check if we are in edit mode based on route parameters */
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.jobETAId = Number(idParam);
      if (Number.isFinite(this.jobETAId) && this.jobETAId > 0) {
        this.isEdit = true;
        this.jobsETAService.getJobsEta(this.jobETAId).subscribe({
          next: eta => this.form.patchValue(eta),
          error: err => console.error('Error fetching job ETA:', err)
        });
      }
    }

    /* Load jobs list for the dropdown */
    this.jobsService.getJobs().subscribe({
      next: jobs => this.jobsList = jobs,
      error: err => console.error('Error fetching jobs:', err)
    });
  }

  /* Handle form submission for add or edit */
  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const jobsETA: JobsETA = {
      rowId: this.jobETAId || 0,
      ...this.form.value
    };

    const request = this.isEdit
      ? this.jobsETAService.updateJobsEta(jobsETA)
      : this.jobsETAService.addJobsEta(jobsETA);

    /* Execute the appropriate request and navigate back to the jobs list on success */
    request.subscribe({
      next: () => {
        this.router.navigate(['/jobs']);
      },
      error: (err: any) => {
        console.error('Error saving job ETA:', err);
      }
    });
  }

}
