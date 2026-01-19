import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomerStatusMessageService } from '../status-messages.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CustomerStatusMessage } from '../status-messages.model';
import { CustomerService } from '../customer.service';
import { Customer } from '../customer.model';

@Component({
  selector: 'app-status-messages-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './status-messages-form.html',
  styleUrls: ['./status-messages-form.css']
})
export class CSMFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  csmId!: number;
  customers: Customer[] = [];

  constructor(
    private fb: FormBuilder,
    private csmService: CustomerStatusMessageService,
    private router: Router,
    private route: ActivatedRoute,
    private customerService: CustomerService
  ) {}

  /* Initialize the form and load CSM data if editing */
  ngOnInit() {
    this.form = this.fb.group({
        customer: ['', Validators.required],
        status: ['', Validators.required],
        message: ['', [Validators.required, Validators.maxLength(500)]],
        active: [true]
    });

    /* Check if we are in edit mode based on route parameters */
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.csmId = Number(idParam);
      if (Number.isFinite(this.csmId) && this.csmId > 0) {
        this.isEdit = true;
      }
    }

    /* If editing, load the CSM data into the form */
    if (this.isEdit) {
      this.csmService.getCSM(this.csmId).subscribe(csm => {
        if (csm) this.form.patchValue(csm);
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

    const csm: CustomerStatusMessage = {
      rowId: this.csmId || 0,
      ...this.form.value
    };

    const request = this.isEdit
      ? this.csmService.updateCSM(csm)
      : this.csmService.addCSM(csm);

    /* Execute the appropriate request and navigate back to the customers list on success */
    request.subscribe({
      next: () => {
        this.router.navigate(['/customers']);
      },
      error: err => {
        console.error('Error saving CSM:', err);
      }
    });
  }

}