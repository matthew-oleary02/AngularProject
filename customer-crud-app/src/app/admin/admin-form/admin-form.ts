import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../user.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Users } from '../user.model';

@Component({
  selector: 'app-admin-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './admin-form.html',
  styleUrls: ['../../styles/form.css'],
})
export class AdminFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  userId!: number;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /* Initialize the form and load customer data if editing */
  ngOnInit() {
    this.form = this.fb.group({
        username: ['', Validators.required],
        firstName: [''],
        lastName: [''],
        email: [''],
        password: ['', Validators.required],
        role: ['', Validators.required],
        active: [true],
    });

    /* Check if we are in edit mode based on route parameters */
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.userId = Number(idParam);
      if (Number.isFinite(this.userId) && this.userId > 0) {
        this.isEdit = true;
      }
    }

    /* If editing, load the customer data into the form */
    if (this.isEdit) {
      this.userService.getUser(this.userId).subscribe(c => {
        if (c) this.form.patchValue(c);
      });
      /* Make password optional for edit mode */
      this.form.get('password')?.setValidators([]);
      this.form.get('password')?.updateValueAndValidity();
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

    const user: Users = {
      id: this.userId || 0,
      ...this.form.value
    };

    const request = this.isEdit
      ? this.userService.updateUser(user)
      : this.userService.addUser(user);

    /* Execute the appropriate request and navigate back to the customer list on success */
    request.subscribe({
      next: () => {
        this.router.navigate(['/admin']);
      },
      error: err => {
        console.error('Error saving user:', err);
      }
    });
  }

}