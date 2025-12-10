import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { VendorService } from '../vendors.service';
import { Vendor } from '../vendors.model';

@Component({
  selector: 'app-vendor-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vendors-view.html',
  styleUrls: ['./vendors-view.css']
})

export class VendorsViewComponent implements OnInit {
  vendor?: Vendor;

  constructor(private vendorService: VendorService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /* Load vendor details based on route parameter */
  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      console.error('Invalid vendor ID', idParam);
    };
    
    /* Fetch vendor details from the service */
    this.vendorService.getVendor(id).subscribe({
      next: v => this.vendor = v,
      error: err => console.error('Error fetching vendor:', err)
    });
  }
}