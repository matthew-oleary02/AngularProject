import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { VendorNotifications } from '../models/vendor-notifications.model';
import { VendorNotificationsService } from '../services/vendor-notifications.service';

@Component({
  selector: 'app-vendor-notifications-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vendor-notifications-view.html',
  styleUrls: ['../../styles/view.css']
})
export class VendorNotificationsViewComponent implements OnInit {
  vendorNotification?: VendorNotifications;

  constructor(
    private vendorNotificationsService: VendorNotificationsService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      console.error('Invalid VendorNotification ID', idParam);
      return;
    }

    /* Fetch VendorNotification details from the service */
    this.vendorNotificationsService.getVendorNotification(id).subscribe({
      next: vnotif => this.vendorNotification = vnotif,
      error: err => console.error('Error fetching VendorNotification:', err)
    });
  }
}
