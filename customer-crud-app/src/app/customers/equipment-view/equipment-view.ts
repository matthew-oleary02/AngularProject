// equipment-view.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { EquipmentService } from '../equipment.service';
import { Equipment } from '../equipment.model';
@Component({
    selector: 'app-equipment-view',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './equipment-view.html',
    styleUrls: ['./equipment-view.css']
})
export class EquipmentViewComponent implements OnInit {
    equipment?: Equipment;

    constructor(private equipmentService: EquipmentService,
        private router: Router,
        private route: ActivatedRoute,
    ) {}

    ngOnInit() {
        const idParam = this.route.snapshot.paramMap.get('id');
        const id = idParam ? Number(idParam) : NaN;
        if (!Number.isFinite(id) || id <= 0) {
            console.error('Invalid equipment ID', idParam);
    };

    this.equipmentService.getEquipmentById(id).subscribe({
        next: eq => this.equipment = eq,
        error: err => console.error('Error fetching equipment:', err)
    });
    }
}
