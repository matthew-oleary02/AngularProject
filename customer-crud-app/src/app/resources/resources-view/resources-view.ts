import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ResourcesService } from '../resources.service';
import { Resources } from '../resources.model';

@Component({
  selector: 'app-resources-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './resources-view.html',
  styleUrls: ['../../styles/view.css'],
})

export class ResourcesViewComponent implements OnInit {
  resources?: Resources;

  constructor(private resourcesService: ResourcesService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /* Load resources details based on route parameter */
  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      console.error('Invalid resource ID', idParam);
    };
    
    /* Fetch resource details from the service */
    this.resourcesService.getResource(id).subscribe({
      next: r => this.resources = r,
      error: err => console.error('Error fetching resource:', err)
    });
  }
}