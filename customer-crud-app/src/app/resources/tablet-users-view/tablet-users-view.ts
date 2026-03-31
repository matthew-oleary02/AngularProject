import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TabletUsersService } from '../tablet-users.service';
import { TabletUser } from '../tablet-users.model';

@Component({
    selector: 'app-tablet-users-view',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './tablet-users-view.html',
    styleUrls: ['../../styles/view.css'],
})

export class TabletUsersViewComponent implements OnInit {
    tabletUser?: TabletUser;

    constructor(private tabletUsersService: TabletUsersService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    /* Load tablet user details based on route parameter */
    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        const id = idParam ? Number(idParam) : NaN;
        if (!Number.isFinite(id) || id <= 0) {
            console.error('Invalid tablet user ID', idParam);
        };

        /* Fetch tablet user details from the service */
        this.tabletUsersService.getTabletUser(id).subscribe({
            next: user => this.tabletUser = user,
            error: err => console.error('Error fetching tablet user:', err)
        });
    }
}