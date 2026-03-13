import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { VehiclesService } from '../vehicles.service';
import { Vehicles } from '../vehicles.model';

@Component({
  selector: 'app-vehicles-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vehicles-view.html',
  styleUrls: ['../../styles/view.css'],
})

export class VehiclesViewComponent implements OnInit {
  vehicles?: Vehicles;

  constructor(private vehiclesService: VehiclesService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /* Load vehicles details based on route parameter */
  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      console.error('Invalid vehicle ID', idParam);
    };
    
    /* Fetch vehicle details from the service */
    this.vehiclesService.getVehicle(id).subscribe({
      next: v => this.vehicles = v,
      error: err => console.error('Error fetching vehicle:', err)
    });
  }
}