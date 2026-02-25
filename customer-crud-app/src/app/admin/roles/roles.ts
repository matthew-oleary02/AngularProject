import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { RolesService } from '../roles.service';
import { Roles } from '../roles.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './roles.html',
  styleUrls: ['../../styles/list.css'],
})
export class RolesComponent implements OnInit {
  roles: Roles[] = [];
  private allRoles: Roles[] = [];
  filterText = '';
  activeFilter: boolean | null = true;

  constructor(private rolesService: RolesService, private router: Router) {}

  ngOnInit() {
    this.rolesService.getRoles().subscribe({
      next: (r: Roles[]) => {
        this.allRoles = r || [];
        this.roles = [...this.allRoles];
      },
      error: (err: any) => console.error('Error fetching roles:', err),
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
  if (!confirm(`Delete role #${id}?`)) return;

  this.rolesService.deleteRole(id).subscribe({
    next: () => {
      this.roles = this.roles.filter(r => r.roleId !== id);
    },
    error: (err) => {
      console.error('Error deleting role:', err);
      alert('Failed to delete role. Please try again.');
    }
  });
}
}