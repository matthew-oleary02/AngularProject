// tablet-users-list.ts

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TabletUser } from '../tablet-users.model';
import { TabletUsersService } from '../tablet-users.service';

@Component({
    selector: 'app-tablet-users-list',
    templateUrl: './tablet-users-list.html',
    styleUrls: ['./tablet-users-list.css']
})

export class TabletUsersListComponent implements OnInit {
    tabletUsers: TabletUser[] = [];
    private allTabletUsers: TabletUser[] = [];

    filterText = '';

    constructor(private tabletUsersService: TabletUsersService, private router: Router) { }

    ngOnInit(): void {
        this.tabletUsersService.getTabletUsers().subscribe({
            next: users => {
                this.allTabletUsers = users || [];
                this.applyFilter();
            },
            error: err => console.error('Error fetching tablet users:', err)
        });
    }

    onFilterChange(query: string) {
        this.filterText = query || '';
        this.applyFilter();
    }

    clearFilter() {
        this.filterText = '';
        this.applyFilter();
    }

    onDelete(id: number) {
        if (!id) return;
        if (!confirm('Delete this tablet user?')) return;

        this.tabletUsersService.deleteTabletUser(id).subscribe({
            next: () => {
                this.allTabletUsers = this.allTabletUsers.filter(u => u.rowId !== id);
                this.applyFilter();
            },
            error: err => console.error('Error deleting tablet user:', err)
        });
    }

    private applyFilter() {
        const query = this.filterText.trim().toLowerCase();
        this.tabletUsers = this.allTabletUsers.filter(u => {
            
            const fields = [
                u.fname,
                u.lname,
                u.pin
            ];
            return fields.some(f => f.toLowerCase().includes(query));
        });
    }
}
