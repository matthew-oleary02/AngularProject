import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ServiceTypes } from '../service-types.model';
import { ServiceTypesService } from '../service-types.service';

@Component({
  selector: 'app-service-types-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './service-types-view.html',
  styleUrls: ['./service-types-view.css']
})

export class ServiceTypesViewComponent implements OnInit {
  st?: ServiceTypes;

  constructor(private serviceTypeService: ServiceTypesService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /* Load customer ETA details based on route parameter */
  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      console.error('Invalid customer eta ID', idParam);
    };
    
    /* Fetch customer eta details from the service */
    this.serviceTypeService.getServiceType(id).subscribe({
      next: st => this.st = st,
      error: err => console.error('Error fetching customer service type:', err)
    });
  }
}