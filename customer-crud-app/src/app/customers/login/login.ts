import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {

  username: string = '';
  password: string = '';
  errorMessage: string = '';
  isRegister = false;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login() {
  const body = { username: this.username, password: this.password };

  this.http.post('http://localhost:3000/api/auth/login', body).subscribe({
    next: (response: any) => {
      localStorage.setItem('token', response.token);
      this.router.navigate(['/customers']);
    },
    error: (err) => {
      this.errorMessage = err.error.message || 'Invalid username or password.';
    }
  });

    if (this.isRegister) {
    this.router.navigate(['/register']);
  }
  
}

  register() {
    const body = { username: this.username, password: this.password, role: 'User', RoleId: 1 };
    this.http.post('http://localhost:3000/api/auth/register', body).subscribe({
      next: (response: any) => {
        localStorage.setItem('token', response.token);
        this.router.navigate(['/customers']);
      }
      ,
      error: (err) => {
        this.errorMessage = err.error.message || 'Registration failed.';
      }
    });
  }
}
