// tablet-users-form.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TabletUsersService } from '../tablet-users.service';
import { TabletUser } from '../tablet-users.model';

@Component({
    selector: 'app-tablet-users-form',
    templateUrl: './tablet-users-form.html',
    styleUrls: ['./tablet-users-form.css']
})
export class TabletUsersFormComponent implements OnInit {
    form!: FormGroup;
    isEditMode = false;
    tabletUserId!: number;
    
    constructor(
        private fb: FormBuilder,
        private tabletUsersService: TabletUsersService,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.form = this.fb.group({
            fname: ['', Validators.required],
            lname: ['', Validators.required],
            pin: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]]
        });

        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            this.tabletUserId = Number(idParam);
            if (Number.isFinite(this.tabletUserId) && this.tabletUserId > 0) {
                this.isEditMode = true;
            }
        }
        if (this.isEditMode) {
            this.tabletUsersService.getTabletUser(this.tabletUserId).subscribe(u => {
                if (u) this.form.patchValue(u);
            });
        }
    }

    submit() {
        if (this.form.invalid) {
            return;
        }
        const tabletUserData: TabletUser = this.form.value;
        if (this.isEditMode) {
            tabletUserData.rowId = this.tabletUserId;
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