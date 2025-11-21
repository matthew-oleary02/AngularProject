import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LoginComponent } from '../login/login';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, LoginComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfileComponent {
  username: string = '{{username}}';
  firstName: string = '';
  lastName: string = '';
  email: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  editProfile() {
    console.log('Edit profile clicked');
  }

  changePassword() {
    console.log('Change password clicked');
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

}
