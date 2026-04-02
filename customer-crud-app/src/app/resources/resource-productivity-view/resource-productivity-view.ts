// resource-productivity-list.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ResourceProductivityService } from '../resource-productivity.service';
import { ResourceProductivity } from '../resource-productivity.model';

@Component({
    selector: 'app-resource-productivity-view',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './resource-productivity-view.html',
    styleUrls: ['../../styles/view.css'],
})

export class ResourceProductivityViewComponent implements OnInit {
    rP?: ResourceProductivity;

    constructor(private resourceProductivityService: ResourceProductivityService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    /* Load resource productivity details based on route parameter */
    ngOnInit() {
        const idParam = this.route.snapshot.paramMap.get('id');
        const id = idParam ? Number(idParam) : NaN;
        if (!Number.isFinite(id) || id <= 0) {
            console.error('Invalid resource productivity ID', idParam);
        };

        /* Fetch resource productivity details from the service */
        this.resourceProductivityService.getResourceProductivityById(id).subscribe({
            next: rp => this.rP = rp,
            error: err => console.error('Error fetching resource productivity:', err)
        });
    }
}
