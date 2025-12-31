import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { LocationService } from '../location.service';
import { Location } from '../location.model';

@Component({
  selector: 'app-location-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './location-view.html',
  styleUrls: ['./location-view.css']
})

export class LocationViewComponent implements OnInit {
  location?: Location;

  constructor(private locationService: LocationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /* Load location details based on route parameter */
  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      console.error('Invalid location ID', idParam);
    };
    
    /* Fetch location details from the service */
    this.locationService.getLocation(id).subscribe({
      next: loc => this.location = loc,
      error: err => console.error('Error fetching location:', err)
    });
  }
}