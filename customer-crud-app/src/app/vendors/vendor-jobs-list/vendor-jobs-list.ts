import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-vendor-jobs-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vendor-jobs-list.html'
})
export class VendorJobsListComponent implements OnInit {
  @Input() vendorId: number | null = null;
  constructor() {}

  ngOnInit(): void {}

  // Collection display and basic navigation for vendor-jobs
}
