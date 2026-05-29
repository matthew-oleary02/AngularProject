// jobs-equipment-view.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { JobsEquipmentService } from '../jobs-equipment.service';
import { JobsEquipment } from '../jobs-equipment.model';
@Component({
    selector: 'app-jobs-equipment-view',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './jobs-equipment-view.html',
    styleUrls: ['../../styles/view.css'],
})
export class JobsEquipmentViewComponent implements OnInit {
    equipment?: JobsEquipment;

    constructor(private jobsEquipmentService: JobsEquipmentService,
        private router: Router,
        private route: ActivatedRoute,
    ) {}

    ngOnInit() {
        const idParam = this.route.snapshot.paramMap.get('id');
        const id = idParam ? Number(idParam) : NaN;
        if (!Number.isFinite(id) || id <= 0) {
            console.error('Invalid equipment ID', idParam);
    };

    this.jobsEquipmentService.getJobsEquipmentById(id).subscribe({
        next: eq => this.jobsEquipment = eq,
        error: err => console.error('Error fetching jobsEquipment:', err)
    });
    }
}
