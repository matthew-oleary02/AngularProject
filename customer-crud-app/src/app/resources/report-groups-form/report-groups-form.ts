import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReportGroupsService } from '../report-groups.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReportGroups } from '../report-groups.model';

@Component({
  selector: 'app-report-groups-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './report-groups-form.html',
  styleUrls: ['../../styles/form.css'],
})
export class ReportGroupsFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  reportGroupId!: number;

  constructor(
    private fb: FormBuilder,
    private reportGroupsService: ReportGroupsService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /* Initialize the form and load report groups data if editing */
  ngOnInit() {
    this.form = this.fb.group({
        groupName: ['', Validators.required],
        employee: ['', Validators.required],
        levelId: [''],
        alertEmail: ['', Validators.required],
        active: [true],
    });

    /* Check if we are in edit mode based on route parameters */
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.reportGroupId = Number(idParam);
      if (Number.isFinite(this.reportGroupId) && this.reportGroupId > 0) {
        this.isEdit = true;
      }
    }

    /* If editing, load the report groups data into the form */
    if (this.isEdit) {
      this.reportGroupsService.getDepartment(this.reportGroupId).subscribe(d => {
        if (d) this.form.patchValue(d);
      });
    }
  }

  /* Handle form submission for add or edit */
  submit() {
    // If not delete action, prevent submission when the form is invalid
    if (this.form.invalid) {
      // mark controls so validation messages appear
      this.form.markAllAsTouched();
      return;
    }

    const reportGroups: ReportGroups = {
      rowId: this.reportGroupId || 0,
      ...this.form.value
    };

    const request = this.isEdit
      ? this.reportGroupsService.updateDepartment(reportGroups)
      : this.reportGroupsService.addDepartment(reportGroups);

    /* Execute the appropriate request and navigate back to the report groups list on success */
    request.subscribe({
      next: () => {
        this.router.navigate(['/report-groups']);
      },
      error: err => {
        console.error('Error saving report-groups:', err);
      }
    });
  }

}