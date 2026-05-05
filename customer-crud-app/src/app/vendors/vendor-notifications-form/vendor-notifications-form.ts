import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { VendorNotifications } from '../models/vendor-notifications.model';
import { VendorNotificationsService } from '../services/vendor-notifications.service';

@Component({
  selector: 'app-vendor-notifications-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './vendor-notifications-form.html',
  styleUrls: ['../../styles/form.css']
})
export class VendorNotificationsFormComponent implements OnInit {
  isEdit = false;
  vendorNotificationId!: number;
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private vendorNotificationsService: VendorNotificationsService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.form = this.fb.group({
      vendor: ['', Validators.required],
      status: ['', Validators.required],
      serviceType: ['', Validators.required],
      serviceClass: ['', Validators.required],
      email: ['', Validators.required],
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.vendorNotificationId = Number(idParam);
      if (Number.isFinite(this.vendorNotificationId) && this.vendorNotificationId > 0) {
        this.isEdit = true;
      }
    }

    if (this.isEdit) {
      this.vendorNotificationsService.getVendorNotification(this.vendorNotificationId).subscribe(vnotif => {
        if (vnotif) this.form.patchValue(vnotif);
      });
    }
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const vendorNotification: VendorNotifications = {
      rowId: this.vendorNotificationId,
      ...this.form.value
    };

    const request = this.isEdit
      ? this.vendorNotificationsService.updateVendorNotification(vendorNotification)
      : this.vendorNotificationsService.addVendorNotification(vendorNotification);

    request.subscribe({
      next: () => {
        console.log(`${this.isEdit ? 'Updated' : 'Added'} VendorNotification successfully`);
        this.router.navigate(['/vendor-notifications'])
      },
      error: err => {
        console.error(`Error ${this.isEdit ? 'updating' : 'adding'} VendorNotification:`, err);
      }
    });
  }

  cancel() {
    this.router.navigate(['/vendor-notifications']);
  }
}
