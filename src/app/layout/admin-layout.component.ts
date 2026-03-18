import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="admin-shell">
      <nav class="sidebar">
        <div class="brand">Facturação</div>
        <a routerLink="/admin/quotes" routerLinkActive="active">Orçamentos</a>
        <a routerLink="/admin/services" routerLinkActive="active">Serviços</a>
        <a routerLink="/admin/settings" routerLinkActive="active">Definições</a>
        <button class="logout" (click)="logout()">Sair</button>
      </nav>
      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .admin-shell { display: flex; min-height: 100vh; }
    .sidebar { width: 200px; background: #1e293b; color: #f1f5f9; display: flex; flex-direction: column; padding: 1.5rem 1rem; gap: 0.5rem; }
    .brand { font-weight: 700; font-size: 1.1rem; margin-bottom: 1rem; color: #38bdf8; }
    .sidebar a { color: #94a3b8; text-decoration: none; padding: 0.5rem 0.75rem; border-radius: 6px; }
    .sidebar a.active { color: #f1f5f9; background: #334155; }
    .logout { margin-top: auto; background: none; border: 1px solid #475569; color: #94a3b8; padding: 0.5rem; border-radius: 6px; cursor: pointer; }
    .content { flex: 1; padding: 2rem; background: #f8fafc; }
  `],
})
export class AdminLayoutComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
