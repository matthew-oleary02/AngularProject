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
      const username = u.username ? u.username.toLowerCase() : '';
      const role = u.role ? u.role.toLowerCase() : '';
      const email = u.email ? u.email.toLowerCase() : '';
      return username.includes(q) || role.includes(q) || email.includes(q);
    });
  }


isAdmin(): boolean {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1])); // Decode JWT
    return payload.role === 'Admin';
  } catch {
    return false;
  }
}
  
onDelete(id: number) {
  if (!Number.isFinite(id) || id <= 0) return;
  if (!confirm(`Delete user #${id}?`)) return;

  this.userService.deleteUser(id).subscribe({
    next: () => {
      this.users = this.users.filter(u => u.id !== id);
    },
    error: (err) => {
      console.error('Error deleting user:', err);
      alert('Failed to delete user. Please try again.');
    }
  });
}

}