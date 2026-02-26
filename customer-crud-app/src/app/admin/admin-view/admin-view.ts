import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { UserService } from '../user.service';
import { Users } from '../user.model';

@Component({
  selector: 'app-admin-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-view.html',
  styleUrls: ['../../styles/view.css'],
})

export class AdminViewComponent implements OnInit {
  user?: Users;

  constructor(private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /* Load user details based on route parameter */
  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      console.error('Invalid user ID', idParam);
    };
    
    /* Fetch user details from the service */
    this.userService.getUser(id).subscribe({
      next: u => this.user = u,
      error: err => console.error('Error fetching user:', err)
    });
  }
}