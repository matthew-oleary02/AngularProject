import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { RolesService } from '../roles.service';
import { Roles } from '../roles.model';

@Component({
  selector: 'app-roles-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './roles-view.html',
  styleUrls: ['../../styles/view.css'],
})

export class RolesViewComponent implements OnInit {
  role?: Roles;

  constructor(private rolesService: RolesService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /* Load role details based on route parameter */
  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      console.error('Invalid role ID', idParam);
    };
    
    /* Fetch role details from the service */
    this.rolesService.getRole(id).subscribe({
      next: r => this.role = r,
      error: err => console.error('Error fetching role:', err)
    });
  }
}