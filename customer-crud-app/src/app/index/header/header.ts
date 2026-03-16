
import { Component, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent implements OnDestroy {
  showAdminMenu = false;
  showCustomerMenu = false;
  showResourcesMenu = false;
  private navSub?: Subscription;

  constructor(private router: Router) {
    // Close dropdown on any successful navigation
    this.navSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.showAdminMenu = false;
        this.showCustomerMenu = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

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

  // Dropdown controls for Admin Menu
  toggleAdminMenu(): void {
    this.showAdminMenu = !this.showAdminMenu;
  }

  closeAdminMenu(): void {
    this.showAdminMenu = false;
  }

   // Dropdown controls for Customer Menu
  toggleCustomerMenu(): void {
    this.showCustomerMenu = !this.showCustomerMenu;
  }

  closeCustomerMenu(): void {
    this.showCustomerMenu = false;
  }

     // Dropdown controls for Customer Menu
  toggleResourcesMenu(): void {
    this.showResourcesMenu = !this.showResourcesMenu;
  }

  closeResourcesMenu(): void {
    this.showResourcesMenu = false;
  }

  // Close when clicking anywhere outside the dropdown
  @HostListener('document:click', ['$event'])
  onDocumentClick(evt: MouseEvent): void {
    const target = evt.target as HTMLElement;
    // If the click is not inside the dropdown container, close it
    if (!target.closest('.nav-dropdown')) {
      this.showAdminMenu = false;
      this.showCustomerMenu = false;
      this.showResourcesMenu = false;
    }
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