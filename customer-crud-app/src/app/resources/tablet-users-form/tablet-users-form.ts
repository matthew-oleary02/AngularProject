// tablet-users-form.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TabletUsersService } from '../tablet-users.service';
import { TabletUser } from '../tablet-users.model';
import { ResourcesService } from '../resources.service';
import { Resources } from '../resources.model';

@Component({
    selector: 'app-tablet-users-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './tablet-users-form.html',
    styleUrls: ['../../styles/form.css'],
})
export class TabletUsersFormComponent implements OnInit {
    form!: FormGroup;
    isEdit = false;
    tabletUserId!: number;
    resources: Resources[] = [];
    
    constructor(
        private fb: FormBuilder,
        private tabletUsersService: TabletUsersService,
        private route: ActivatedRoute,
        private router: Router,
        private resourcesService: ResourcesService // Inject ResourcesService
    ) { }

    ngOnInit(): void {
        this.form = this.fb.group({
            resourceId: ['', Validators.required],
            pin: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]]
        });

        // Fetch all resources for dropdown
        this.resourcesService.getResources().subscribe(r => this.resources = r || []);

        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            this.tabletUserId = Number(idParam);
            if (Number.isFinite(this.tabletUserId) && this.tabletUserId > 0) {
                this.isEdit = true;
            }
        }
        if (this.isEdit) {
            this.tabletUsersService.getTabletUser(this.tabletUserId).subscribe(u => {
                if (u) {
                    // If editing, set resourceId from the user data if available
                    this.form.patchValue({
                        resourceId: u.resourceId,
                        pin: u.pin
                    });
                }
            });
        }
    }

    submit() {
        if (this.form.invalid) {
            return;
        }
        const tabletUserData: TabletUser = {
            rowId: this.isEdit ? this.tabletUserId : 0,
            resourceId: this.form.value.resourceId,
            pin: this.form.value.pin,
            createdOn: new Date(), // You may want to set these properly
            createdBy: '',
            modifiedOn: new Date(),
            modifiedBy: ''
        };
        if (this.isEdit) {
            this.tabletUsersService.updateTabletUser(tabletUserData).subscribe({
                next: () => this.router.navigate(['/tablet-users']),
                error: err => console.error('Error updating tablet user:', err)
            });
        } else {
            this.tabletUsersService.addTabletUser(tabletUserData).subscribe({
                next: () => this.router.navigate(['/tablet-users']),
                error: err => console.error('Error updating tablet user:', err)
            });
        }
    }
}