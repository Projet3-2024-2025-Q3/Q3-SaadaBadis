import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
  // Redirection par défaut vers login
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  
  // Route pour le login
  { path: 'login', component: LoginComponent },
  
  // Route wildcard pour les pages non trouvées (optionnel)
  { path: '**', redirectTo: '/login' }
];