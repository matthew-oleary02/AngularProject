import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ResourcesService } from '../resources.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Resources } from '../resources.model';

@Component({
  selector: 'app-resources-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './resources-form.html',
  styleUrls: ['../../styles/form.css'],
})
export class ResourcesFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  resourceId!: number;

  constructor(
    private fb: FormBuilder,
    private resourcesService: ResourcesService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /* Initialize the form and load resource data if editing */
  ngOnInit() {
    this.form = this.fb.group({
      fname: ['', Validators.required],
      lname: ['', Validators.required],
      contactInfo: this.fb.group({
        title: [''],
        department: [''],
        phone: [''],
        cellphone: [''],
        email: [''],
        address1: [''],
        address2: [''],
        city: [''],
        state: [''],
        zipCode: [''],
        hireDate: [''],
        leadTech: [false],
        active: [true],
      }),
      company: [''],
      employmentType: [''],
      pin: [''],
      dob: [''],
      groupName: ['']
    });

    /* Check if we are in edit mode based on route parameters */
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.resourceId = Number(idParam);
      if (Number.isFinite(this.resourceId) && this.resourceId > 0) {
        this.isEdit = true;
      }
    }

    /* If editing, load the resource data into the form */
    if (this.isEdit) {
      this.resourcesService.getResource(this.resourceId).subscribe(r => {
        if (r) this.form.patchValue(r);
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

    const resource: Resources = {
      rowId: this.resourceId || 0,
      ...this.form.value
    };

    const request = this.isEdit
      ? this.resourcesService.updateResources(resource)
      : this.resourcesService.addResources(resource);

    /* Execute the appropriate request and navigate back to the resources list on success */
    request.subscribe({
      next: () => {
        this.router.navigate(['/resources']);
      },
      error: err => {
        console.error('Error saving resources:', err);
      }
    });
  }

}