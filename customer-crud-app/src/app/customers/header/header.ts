import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent {
  constructor(private router: Router) {}

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  handleAuth(): void {
    if (this.isLoggedIn()) {
      localStorage.removeItem('token');
      this.router.navigate(['/login']);
    } else {
      this.router.navigate(['/login']);
    }
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
}
