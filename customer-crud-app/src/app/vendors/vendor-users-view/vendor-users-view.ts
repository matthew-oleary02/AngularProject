import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { VendorUsers } from '../models/vendor-users.model';
import { VendorUsersService } from '../services/vendor-users.service';

@Component({
  selector: 'app-vendor-users-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vendor-users-view.html',
  styleUrls: ['../../styles/view.css'],
})

export class VendorUsersViewComponent implements OnInit {
    vendorUser?: VendorUsers;

    constructor(private vendorUsersService: VendorUsersService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    /* Load vendor user details based on route parameter */
    ngOnInit() {
        const idParam = this.route.snapshot.paramMap.get('id');
        const id = idParam ? Number(idParam) : NaN;
        if (!Number.isFinite(id) || id <= 0) {
            console.error('Invalid vendor user ID', idParam);
            return;
        }

        /* Fetch vendor user details from the service */
        this.vendorUsersService.getVendorUser(id).subscribe({
            next: user => this.vendorUser = user,
            error: err => console.error('Error fetching vendor user:', err)
        });
    }
}
