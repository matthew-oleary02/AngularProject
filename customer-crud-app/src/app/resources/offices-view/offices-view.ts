import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { OfficesService } from '../offices.service';
import { Office } from '../offices.model';

@Component({
  selector: 'app-offices-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './offices-view.html',
  styleUrls: ['../../styles/view.css'],
})

export class OfficesViewComponent implements OnInit {
  office?: Office;

  constructor(private officeService: OfficesService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /* Load office details based on route parameter */
  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      console.error('Invalid office ID', idParam);
    };
    
    /* Fetch office details from the service */
    this.officeService.getOffice(id).subscribe({
      next: o => this.office = o,
      error: err => console.error('Error fetching office:', err)
    });
  }
}