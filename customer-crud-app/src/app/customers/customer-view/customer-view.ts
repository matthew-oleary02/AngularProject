import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
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
  customer!: Customer;

  constructor(
    private route: ActivatedRoute,
    private customerService: CustomerService
  ) {}

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.customerService.getCustomer(id).subscribe(c => this.customer = c);
  }
}