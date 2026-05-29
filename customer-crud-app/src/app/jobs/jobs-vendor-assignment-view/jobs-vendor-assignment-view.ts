import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { JobsVendorAssignmentService } from '../jobs-vendor-assignment.service';
import { JobsVendorAssignment } from '../jobs-vendor-assignment.model';

@Component({
  selector: 'app-jobs-vendor-assignment-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './jobs-vendor-assignment-view.html',
  styleUrls: ['../../styles/view.css'],
})
export class JobsVendorAssignmentViewComponent implements OnInit {
  status?: JobsVendorAssignment;

  constructor(
    private statusService: JobsVendorAssignmentService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      console.error('Invalid job contract status ID', idParam);
      return;
    }
    
    this.statusService.getContractStatus(id).subscribe({
      next: data => this.status = data,
      error: err => console.error('Error fetching job contract status:', err)
    });
  }
}
