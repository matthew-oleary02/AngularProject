import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CustomerNotifs } from '../customer-notifs.model';
import { CustomerNotifsService } from '../customer-notifs.service';

@Component({
  selector: 'app-customer-notifs-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './customer-notifs-view.html',
  styleUrls: ['../../styles/view.css']
})
export class CustomerNotifsViewComponent implements OnInit {
  customerNotif?: CustomerNotifs;

  constructor(private customerNotifsService: CustomerNotifsService,
    private router: Router,
    private route: ActivatedRoute) { }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      console.error('Invalid CustomerNotif ID', idParam);
    };

    /* Fetch CustomerNotif details from the service */
    this.customerNotifsService.getCustomerNotif(id).subscribe({
      next: customerNotif => this.customerNotif = customerNotif,
      error: err => console.error('Error fetching CustomerNotif:', err)
    });
  }

  // Read-only entity display for CustomerNotifs
}
