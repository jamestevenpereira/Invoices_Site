import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent) },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'quotes', pathMatch: 'full' },
      { path: 'quotes', loadComponent: () => import('./features/quotes/list/quotes-list.component').then(m => m.QuotesListComponent) },
      // quotes/new MUST be before quotes/:id — Angular matches in order
      { path: 'quotes/new', loadComponent: () => import('./features/quotes/new/quote-builder.component').then(m => m.QuoteBuilderComponent) },
      { path: 'quotes/:id', loadComponent: () => import('./features/quotes/detail/quote-detail.component').then(m => m.QuoteDetailComponent) },
      { path: 'services', loadComponent: () => import('./features/services/services-catalogue.component').then(m => m.ServicesCatalogueComponent) },
      { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent) },
    ],
  },
  { path: '', redirectTo: '/admin', pathMatch: 'full' },
  { path: '**', redirectTo: '/admin' },
];
