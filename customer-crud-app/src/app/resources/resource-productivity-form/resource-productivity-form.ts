// resource-productivity-list.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ResourceProductivity } from '../resource-productivity.model';
import { ResourceProductivityService } from '../resource-productivity.service';

@Component({
    selector: 'app-resource-productivity-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './resource-productivity-form.html',
    styleUrls: ['../../styles/form.css'],
})

export class ResourceProductivityFormComponent implements OnInit {
    form!: FormGroup;
    isEdit = false;
    resourceProductivityId!: number;

    constructor(
        private fb: FormBuilder,
        private resourceProductivityService: ResourceProductivityService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit() {
        this.form = this.fb.group({
            employee: ['', Validators.required],
            productivityRate: [''],
            variance: [''],
        });

        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            this.resourceProductivityId = Number(idParam);
            if (Number.isFinite(this.resourceProductivityId) && this.resourceProductivityId > 0) {
                this.isEdit = true;
            }
        }

        if (this.isEdit) {
            this.resourceProductivityService.getResourceProductivityById(this.resourceProductivityId).subscribe(rp => {
                if (rp) this.form.patchValue(rp);
            });
        }
    }

    submit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const resourceProductivity: ResourceProductivity = {
            rowId: this.resourceProductivityId || 0,
            ...this.form.value,
        };

        const request = this.isEdit
            ? this.resourceProductivityService.updateResourceProductivity(resourceProductivity)
            : this.resourceProductivityService.addResourceProductivity(resourceProductivity);

        request.subscribe({
            next: () => {
                this.router.navigate(['/resource-productivity']);
            },
            error: err => {
                console.error('Error saving resource productivity record:', err);
            }
        });
    }
}