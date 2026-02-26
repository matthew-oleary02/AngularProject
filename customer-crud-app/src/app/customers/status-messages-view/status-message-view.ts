import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CustomerStatusMessageService } from '../status-messages.service';
import { CustomerStatusMessage } from '../status-messages.model';

@Component({
  selector: 'app-status-message-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './status-message-view.html',
  styleUrls: ['../../styles/view.css'],
})

export class CSMViewComponent implements OnInit {
  statusMessage?: CustomerStatusMessage;

  constructor(private csmService: CustomerStatusMessageService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /* Load CSM details based on route parameter */
  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      console.error('Invalid CSM ID', idParam);
    };
    
    /* Fetch CSM details from the service */
    this.csmService.getCSM(id).subscribe({
      next: csm => this.statusMessage = csm,
      error: err => console.error('Error fetching CSM:', err)
    });
  }
}