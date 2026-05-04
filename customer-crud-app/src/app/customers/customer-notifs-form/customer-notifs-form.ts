import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CustomerNotifs } from '../customer-notifs.model';
import { CustomerNotifsService } from '../customer-notifs.service';

@Component({
  selector: 'app-customer-notifs-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './customer-notifs-form.html',
  styleUrls: ['../../styles/form.css']
})
export class CustomerNotifsFormComponent implements OnInit {
  isEdit = false;
  customerNotifId!: number;
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private customerNotifsService: CustomerNotifsService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.form = this.fb.group({
      customer: ['', Validators.required],
      status: ['', Validators.required],
      serviceType: ['', Validators.required],
      serviceClass: ['', Validators.required],
      email: ['', Validators.required],
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.customerNotifId = Number(idParam);
      if (Number.isFinite(this.customerNotifId) && this.customerNotifId > 0) {
        this.isEdit = true;
      }
    }

    if (this.isEdit) {
      this.customerNotifsService.getCustomerNotif(this.customerNotifId).subscribe(cnotif => {
        if (cnotif) this.form.patchValue(cnotif);
      });
    }
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const customerNotif: CustomerNotifs = {
      rowId: this.customerNotifId,
      ...this.form.value
    };

    const request = this.isEdit
      ? this.customerNotifsService.updateCustomerNotif(customerNotif)
      : this.customerNotifsService.addCustomerNotif(customerNotif);

    request.subscribe({
      next: () => {
        console.log(`${this.isEdit ? 'Updated' : 'Added'} CustomerNotif successfully`);
        this.router.navigate(['/customer-notifs'])
      },
      error: err => {
        console.error(`Error ${this.isEdit ? 'updating' : 'adding'} CustomerNotif:`, err);
      }
    });
  }
}
