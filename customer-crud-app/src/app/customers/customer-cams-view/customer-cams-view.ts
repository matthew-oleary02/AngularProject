import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CustomerCAMs } from '../customer-cams.model';
import { CustomerCAMsService } from '../customer-cams.service';

@Component({
  selector: 'app-customer-cams-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './customer-cams-view.html',
  styleUrls: ['../../styles/view.css'],
})

export class CustomerCamsViewComponent implements OnInit {
    customerCams?: CustomerCAMs;

    constructor(private customerCamsService: CustomerCAMsService,
        private router: Router,
        private route: ActivatedRoute
    ) {}
    /* Load customer CAMs details based on route parameter */
    ngOnInit() {
        const idParam = this.route.snapshot.paramMap.get('id');
        const id = idParam ? Number(idParam) : NaN;
        if (!Number.isFinite(id) || id <= 0) {
            console.error('Invalid customer CAMs ID', idParam);
        };
        /* Fetch customer CAMs details from the service */
        this.customerCamsService.getCC(id).subscribe({
            next: cams => this.customerCams = cams,
            error: err => console.error('Error fetching customer CAMs:', err)
        });
    }
}
