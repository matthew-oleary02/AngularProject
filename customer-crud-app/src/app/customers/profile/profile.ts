import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfileComponent {
  username: string = '';
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  password: string = '';

  private apiUrl = 'http://localhost:3000/profile';

  constructor(private http: HttpClient, private router: Router) {}
  
  ngOnInit(): void {
    this.loadUserProfile();
  }

/** Fetch user profile from backend */
  private loadUserProfile(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.get<any>(this.apiUrl, { headers }).subscribe({
      next: (data) => {
        this.username = data.username;
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.email = data.email;

      },
      error: (err) => {
        console.error('Error fetching profile:', err);
        if (err.status === 401) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  editProfile() {
    this.router.navigate(['/profile/edit']);
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

}
