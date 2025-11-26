/* profile-form.ts */

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileService } from '../profile.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Profile } from '../profile.model';

@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './profile-form.html',
  styleUrls: ['./profile-form.css']
})
export class ProfileFormComponent implements OnInit {
    form!: FormGroup;
    profileId!: number;
    
    constructor(
        private fb: FormBuilder,
        private profileService: ProfileService,
        private router: Router,
        private route: ActivatedRoute
    ) {}
    /* Initialize the form and load profile data */
    ngOnInit() {
        this.form = this.fb.group({
            username: ['', Validators.required],
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]]
        });
        /* Load profile data */
        this.loadUserProfile();
    }
    /* Fetch user profile from backend */
    private loadUserProfile(): void {
        this.profileService.getProfile().subscribe({
            next: (data: Profile) => {
                this.form.patchValue({
                    username: data.username,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email
                });
            },
            error: (err) => {
                console.error('Error fetching profile:', err);
                this.router.navigate(['/login']);
            }
        });
    }
    /* Handle form submission to update profile */
    onSubmit() {
        if (this.form.valid) {
            const updatedProfile: Profile = this.form.value;
            this.profileService.updateProfile(updatedProfile).subscribe({
                next: (data: Profile) => {
                    console.log('Profile updated successfully:', data);
                    this.router.navigate(['/profile', data.id]);
                },
                error: (err) => {
                    console.error('Error updating profile:', err);
                }
            });
        }
    }
}