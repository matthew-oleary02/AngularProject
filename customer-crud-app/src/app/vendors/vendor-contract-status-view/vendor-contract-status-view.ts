import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { VendorContractStatusService } from '../services/vendor-contract-status.service';
import { VendorContractStatus } from '../models/vendor-contract-status.model';

@Component({
  selector: 'app-vendor-contract-status-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vendor-contract-status-view.html',
  styleUrls: ['../../styles/view.css'],
})
export class VendorContractStatusViewComponent implements OnInit {
  status?: VendorContractStatus;

  constructor(
    private statusService: VendorContractStatusService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      console.error('Invalid vendor contract status ID', idParam);
      return;
    }
    
    this.statusService.getContractStatus(id).subscribe({
      next: data => this.status = data,
      error: err => console.error('Error fetching vendor contract status:', err)
    });
  }
}
