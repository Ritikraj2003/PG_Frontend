import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/types';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private router = inject(Router);

  private userSubject = new BehaviorSubject<User | null>(this.loadInitialUser());
  public user$ = this.userSubject.asObservable();

  private isAuthOpenSubject = new BehaviorSubject<boolean>(false);
  public isAuthOpen$ = this.isAuthOpenSubject.asObservable();

  private loadInitialUser(): User | null {
    const savedUser = sessionStorage.getItem('user') || localStorage.getItem('user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (err) {
        console.error('Error parsing stored user:', err);
      }
    }
    return null;
  }

  public get currentUser(): User | null {
    return this.userSubject.value;
  }

  public openAuthModal() {
    this.isAuthOpenSubject.next(true);
  }

  public closeAuthModal() {
    this.isAuthOpenSubject.next(false);
  }

  public handleLoginSuccess(user: User, token: string) {
    this.userSubject.next(user);
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.closeAuthModal();

    if (user.roles.includes('SUPER_ADMIN')) {
      this.router.navigate(['/admin']);
    } else if (user.roles.includes('OWNER')) {
      this.router.navigate(['/owner']);
    } else {
      this.router.navigate(['/tenant']);
    }
  }

  public logout() {
    this.userSubject.next(null);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.openAuthModal();
    this.router.navigate(['/browse']);
  }
}
