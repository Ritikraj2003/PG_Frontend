import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { filter } from 'rxjs/operators';
import { AuthModalComponent } from './components/auth-modal/auth-modal.component';
import { LoaderComponent } from './components/loader/loader.component';
import { User } from './models/types';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent,
    AuthModalComponent,
    LoaderComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  public authService = inject(AuthService);
  private router = inject(Router);

  user: User | null = null;
  isAuthOpen = false;
  isOwnerRoute = false;
  isPortalRoute = false;

  private checkPortalRoute(url?: string): boolean {
    if (!url) return false;
    return url.startsWith('/owner') || url.startsWith('/admin') || url.startsWith('/tenant');
  }

  constructor() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        const url = e.urlAfterRedirects || e.url || '';
        this.isOwnerRoute = url.startsWith('/owner');
        this.isPortalRoute = this.checkPortalRoute(url);
      });
  }

  ngOnInit() {
    const currentUrl = this.router.url || '';
    this.isOwnerRoute = currentUrl.startsWith('/owner');
    this.isPortalRoute = this.checkPortalRoute(currentUrl);
    this.authService.user$.subscribe(user => {
      this.user = user;
    });
    this.authService.isAuthOpen$.subscribe(isOpen => {
      this.isAuthOpen = isOpen;
    });
  }

  openAuth() {
    this.authService.openAuthModal();
  }

  closeAuth() {
    this.authService.closeAuthModal();
  }

  onLoginSuccess(event: { user: User; token: string }) {
    this.authService.handleLoginSuccess(event.user, event.token);
  }

  logout() {
    this.authService.logout();
  }
}

