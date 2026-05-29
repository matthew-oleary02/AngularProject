import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { JobsNotesService } from '../jobs-notes.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { JobNote } from '../jobs-notes.model';
import { JobService } from '../jobs.service';
import { Job } from '../jobs.model';

@Component({
  selector: 'app-jobs-notes-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './jobs-notes-form.html',
  styleUrls: ['../../styles/form.css'],
})
export class JobsNotesFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  noteId!: number;
  jobs: Job[] = [];

  constructor(
    private fb: FormBuilder,
    private jobsNotesService: JobsNotesService,
    private router: Router,
    private route: ActivatedRoute,
    private jobService: JobService
  ) {}

  /* Initialize the form and load note data if editing */
  ngOnInit() {
    this.form = this.fb.group({
        job: ['', Validators.required],
        status: ['', Validators.required],
        message: ['', [Validators.required, Validators.maxLength(500)]],
        active: [true]
    });

    /* Check if we are in edit mode based on route parameters */
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.noteId = Number(idParam);
      if (Number.isFinite(this.noteId) && this.noteId > 0) {
        this.isEdit = true;
      }
    }

    /* If editing, load the note data into the form */
    if (this.isEdit) {
      this.jobsNotesService.getJobNote(this.noteId).subscribe(note => {
        if (note) this.form.patchValue(note);
      });
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

    const note: JobNote = {
      rowId: this.noteId || 0,
      ...this.form.value
    };

    const request = this.isEdit
      ? this.jobsNotesService.updateJobNote(note)
      : this.jobsNotesService.addJobNote(note);

    /* Execute the appropriate request and navigate back on success */
    request.subscribe({
      next: () => {
        // TODO: Verify target route for job notes navigation
        this.router.navigate(['/jobs']);
      },
      error: err => {
        console.error('Error saving job note:', err);
      }
    });
  }
}
