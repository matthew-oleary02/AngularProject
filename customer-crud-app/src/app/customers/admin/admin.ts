import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { UserService } from '../user.service';
import { Users } from '../user.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css'],
})
export class AdminComponent implements OnInit {
  users: Users[] = [];
  private allUsers: Users[] = [];
  filterText = '';
  activeFilter: boolean | null = true;

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit() {
    this.userService.getUsers().subscribe({
      next: (u: Users[]) => {
        this.allUsers = u || [];
        this.applyFilters();
      },
      error: (err: any) => console.error('Error fetching users:', err),
    });
  }

  onFilterChange(query: string) {
    this.filterText = query || '';
    this.applyFilters();
  }

  private applyFilters() {
    const q = this.filterText.toLowerCase().trim();
    this.users = this.allUsers.filter((u) => {
      return (
        u.username.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    });
  }

  editUser(id: number) {
    this.router.navigate(['/edit-user', id]);
  }

  deleteUser(id: number) {
    this.userService.deleteUser(id).subscribe(() => {
      this.users = this.users.filter((u) => u.id !== id);
    });
  }
}