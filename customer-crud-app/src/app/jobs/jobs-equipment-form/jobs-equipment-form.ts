//jobs-equipment-form.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { JobsEquipmentService } from '../jobs-equipment.service';
import { JobsEquipment } from '../jobs-equipment.model';
import { JobsService } from '../jobs.service'; // Adjust the path as necessary
import { Jobs } from '../jobs.model'; // Adjust the path as necessary

@Component({
    selector: 'app-jobs-equipment-form',
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule],
    templateUrl: './jobs-equipment-form.html',
    styleUrls: ['../../styles/form.css'],
})

export class JobsEquipmentFormComponent implements OnInit {
    form!: FormGroup;
    isEdit = false;
    jobsEquipmentId!: number;
    jobs: Jobs[] = [];

    constructor(
        private fb: FormBuilder,
        private jobsEquipmentService: JobsEquipmentService,
        private router: Router,
        private route: ActivatedRoute,
        private jobsService: JobsService
    ) {}

    ngOnInit() {
        this.form = this.fb.group({
            job: ['', Validators.required],
            location: ['', Validators.required],
            entryStatus: [''],
            manufacturer: [''],
            model: [''],
            serialNumber: [''],
            tonnage: [''],
            age: [''],
            condition: [''],
            typeOfUnit: [''],
            dateLoaded: ['']
        });
    

    /* Check if we are in edit mode based on route parameters and load equipment data if editing */
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
        this.jobsEquipmentId = Number(idParam);
        if (Number.isFinite(this.jobsEquipmentId) && this.jobsEquipmentId > 0) {
            this.isEdit = true;
            }
        }

        /* If editing, load the location data into the form */
    if (this.isEdit) {
      this.jobsEquipmentService.getJobsEquipmentById(this.jobsEquipmentId).subscribe(c => {
        if (c) this.form.patchValue(c);
      });
    }

    this.loadJobs();
  }

    loadJobs(): void {
    this.jobsService.getJobs().subscribe((data: Jobs[]) => {
      this.jobs = data;
    });
  }

    submit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const jobsEquipment: JobsEquipment = {
            rowId: this.jobsEquipmentId || 0,
            ...this.form.value
        };

        const request = this.isEdit
            ? this.jobsEquipmentService.updateJobsEquipment(jobsEquipment)
            : this.jobsEquipmentService.addJobsEquipment(jobsEquipment);

        request.subscribe({
            next: () => {
                this.router.navigate(['/jobs']);
            },
            error: err => {
                console.error('Error saving jobsEquipment:', err);
            }
        });
    }
}