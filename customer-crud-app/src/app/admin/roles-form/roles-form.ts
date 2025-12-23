import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RolesService } from '../roles.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Roles } from '../roles.model';

@Component({
  selector: 'app-roles-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './roles-form.html',
  styleUrls: ['./roles-form.css']
})
export class RolesFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  roleId!: number;

  constructor(
    private fb: FormBuilder,
    private rolesService: RolesService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /* Initialize the form and load role data if editing */
  ngOnInit() {
    this.form = this.fb.group({
        roleName: ['', Validators.required],
        roleDescription: [''],
    });

    /* Check if we are in edit mode based on route parameters */
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.roleId = Number(idParam);
      if (Number.isFinite(this.roleId) && this.roleId > 0) {
        this.isEdit = true;
      }
    }

    /* If editing, load the role data into the form */
    if (this.isEdit) {
      this.rolesService.getRole(this.roleId).subscribe(r => {
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

    const role: Roles = {
      roleId: this.roleId || 0,
      ...this.form.value
    };

    const request = this.isEdit
      ? this.rolesService.updateRole(role)
      : this.rolesService.addRole(role);

    /* Execute the appropriate request and navigate back to the roles list on success */
    request.subscribe({
      next: () => {
        this.router.navigate(['/roles']);
      },
      error: err => {
        console.error('Error saving role:', err);
      }
    });
  }

}