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
  showSubButtons: boolean = false; // Add this property

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

  isManager(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1])); // Decode JWT
      return payload.role === 'Manager';
    } catch {
      return false;
    }
}

  /*
  toggleDropdown(event: Event): void {
    event.preventDefault();
    const dropdown = document.querySelector('.dropdown-content');
    if (dropdown) {
      dropdown.classList.toggle('show');
    }
  }

  toggleSubButtons() {
    this.showSubButtons = !this.showSubButtons; // Add this method
  }

  get dropdownOpen(): boolean {
    const dropdown = document.querySelector('.dropdown-content');
    return dropdown ? dropdown.classList.contains('show') : false;
  }
  */
}