import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
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
