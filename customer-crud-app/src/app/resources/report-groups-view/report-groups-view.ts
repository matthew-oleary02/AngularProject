import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ReportGroupsService } from '../report-groups.service';
import { ReportGroups } from '../report-groups.model';

@Component({
  selector: 'app-report-groups-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './report-groups-view.html',
  styleUrls: ['../../styles/view.css'],
})

export class ReportGroupsViewComponent implements OnInit {
  departments?: ReportGroups;

  constructor(private reportGroupsService: ReportGroupsService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /* Load report groups details based on route parameter */
  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      console.error('Invalid report groups ID', idParam);
    };
    
    /* Fetch report groups details from the service */
    this.reportGroupsService.getDepartment(id).subscribe({
      next: d => this.departments = d,
      error: err => console.error('Error fetching department:', err)
    });
  }
}