import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { JobsETA } from '../jobs-eta.model';
import { JobsETAService } from '../jobs-eta.service';

@Component({
  selector: 'app-jobs-eta-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './jobs-eta-view.html',
  styleUrls: ['../../styles/view.css'],
})

export class JobsETAViewComponent implements OnInit {
  eta?: JobsETA;

  constructor(private jobsETAService: JobsETAService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /* Load job ETA details based on route parameter */
  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      console.error('Invalid job eta ID', idParam);
    };
    
    /* Fetch job eta details from the service */
    this.jobsETAService.getJobsEta(id).subscribe({
      next: eta => this.eta = eta,
      error: err => console.error('Error fetching job eta:', err)
    });
  }
}
