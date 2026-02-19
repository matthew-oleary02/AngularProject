import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { JobsService } from '../jobs.service';
import { Jobs } from '../jobs.model';

@Component({
  selector: 'app-jobs-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './jobs-view.html',
  styleUrls: ['./jobs-view.css']
})

export class JobsViewComponent implements OnInit {
  jobs?: Jobs;
  activeTab: string = 'jobStatusNotes';  // single tab controller

  constructor(private jobsService: JobsService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /* Load job details based on route parameter */
  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      console.error('Invalid job ID', idParam);
    };
    
    /* Fetch job details from the service */
    this.jobsService.getJob(id).subscribe({
      next: oc => this.jobs = oc,
      error: err => console.error('Error fetching job:', err)
    });
  }
}