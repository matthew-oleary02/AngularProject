import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CustomerETA } from '../customer-eta.model';
import { CustomerETAService } from '../customer-eta.service';

@Component({
  selector: 'app-customer-eta-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './customer-eta-view.html',
  styleUrls: ['../../styles/view.css'],
})

export class CustomerETAViewComponent implements OnInit {
  eta?: CustomerETA;

  constructor(private customerETAService: CustomerETAService,
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
    this.customerETAService.getCustomerEta(id).subscribe({
      next: eta => this.eta = eta,
      error: err => console.error('Error fetching customer eta:', err)
    });
  }
}