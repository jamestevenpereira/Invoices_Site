import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login-wrap">
      <div class="login-card">
        <h1>Acesso Restrito</h1>
        <form (ngSubmit)="submit()">
          <label>Palavra-passe</label>
          <input type="password" [ngModel]="password()" (ngModelChange)="password.set($event)" name="password" required autofocus />
          @if (error()) {
            <p class="error">{{ error() }}</p>
          }
          <button type="submit" [disabled]="loading()">
            {{ loading() ? 'A entrar...' : 'Entrar' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-wrap { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f1f5f9; }
    .login-card { background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,.08); width: 320px; }
    h1 { font-size: 1.25rem; margin-bottom: 1.5rem; color: #1e293b; }
    label { display: block; font-size: .875rem; color: #64748b; margin-bottom: .25rem; }
    input { width: 100%; padding: .625rem .75rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 1rem; box-sizing: border-box; margin-bottom: .75rem; }
    button { width: 100%; padding: .75rem; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 1rem; cursor: pointer; }
    button:disabled { opacity: .6; }
    .error { color: #ef4444; font-size: .875rem; margin-bottom: .75rem; }
  `],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  password = signal('');
  loading = signal(false);
  error = signal('');

  async submit() {
    this.loading.set(true);
    this.error.set('');
    try {
      await this.auth.login(this.password());
      this.router.navigate(['/admin']);
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Erro ao entrar');
    } finally {
      this.loading.set(false);
    }
  }
}
