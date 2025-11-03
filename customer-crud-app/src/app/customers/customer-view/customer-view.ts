import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CustomerService } from '../customer.service';
import { Customer } from '../customer.model';

@Component({
  selector: 'app-customer-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './customer-view.html',
  styleUrls: ['./customer-view.css']
})

export class CustomerViewComponent implements OnInit {
  customer?: Customer;

  constructor(private customerService: CustomerService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      console.error('Invalid customer ID', idParam);
    };
    
    this.customerService.getCustomer(id).subscribe({
      next: c => this.customer = c,
      error: err => console.error('Error fetching customers:', err)
    });
  }
}