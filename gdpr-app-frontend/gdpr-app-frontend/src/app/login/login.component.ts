// src/app/login/login.component.ts - Version mise à jour
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

// Services
import { AuthService, LoginRequest } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  // Propriétés du formulaire
  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  showPassword: boolean = false;
  
  // États du composant
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    // Rediriger si déjà connecté
    if (this.authService.isAuthenticated()) {
      this.redirectToDashboard();
    }
  }

  /**
   * Gestionnaire de soumission du formulaire de connexion
   */
  onSubmit(): void {
    // Empêcher les soumissions multiples
    if (this.isLoading) return;

    // Validation côté client
    if (!this.isFormValid()) {
      this.showError('Veuillez remplir tous les champs correctement');
      return;
    }

    // Réinitialiser l'état
    this.isLoading = true;
    this.errorMessage = '';

    const loginData: LoginRequest = {
      email: this.email.trim(),
      password: this.password
    };

    console.log('Tentative de connexion pour:', loginData.email);

    // Appel au service d'authentification
    this.authService.login(loginData).subscribe({
      next: (response) => {
        console.log('Connexion réussie:', response);
        this.showSuccess(`Bienvenue ${response.firstname} !`);
        
        // Gérer "Se souvenir de moi"
        if (this.rememberMe) {
          // TODO: Implémenter la persistance du token
          console.log('Option "Se souvenir de moi" activée');
        }

        // Rediriger selon le rôle
        this.redirectBasedOnRole(response.role);
      },
      error: (error) => {
        console.error('Erreur de connexion:', error);
        this.isLoading = false;
        this.errorMessage = error.message || 'Erreur de connexion';
        this.showError(this.errorMessage);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  /**
   * Gestionnaire pour le mot de passe oublié
   */
  onForgotPassword(): void {
    console.log('Redirection vers la page mot de passe oublié');
    // TODO: Créer le composant forgot-password
    // this.router.navigate(['/forgot-password']);
    
    this.showInfo('Fonctionnalité "Mot de passe oublié" - À implémenter');
  }

  /**
   * Gestionnaire pour l'inscription
   */
  onRegister(): void {
    console.log('Redirection vers la page d\'inscription');
    // TODO: Créer le composant register
    // this.router.navigate(['/register']);
    
    this.showInfo('Fonctionnalité "S\'inscrire" - À implémenter');
  }

  /**
   * Basculer la visibilité du mot de passe
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Nettoyer le message d'erreur
   */
  clearError(): void {
    this.errorMessage = '';
  }

  /**
   * Gestionnaire pour la touche Entrée dans les champs
   */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onSubmit();
    }
  }

  /**
   * Validation côté client de l'email
   */
  isEmailValid(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email.trim());
  }

  /**
   * Validation côté client du mot de passe
   */
  isPasswordValid(): boolean {
    return this.password.length >= 6;
  }

  /**
   * Vérifie si le formulaire est valide
   */
  isFormValid(): boolean {
    return this.isEmailValid() && this.isPasswordValid();
  }

  /**
   * Pré-remplir les champs pour les tests
   */
  fillDemoCredentials(): void {
    this.email = 'admin@gdpr.com';
    this.password = 'admin123';
  }

  // ================== MÉTHODES PRIVÉES ==================

  /**
   * Rediriger selon le rôle utilisateur
   */
  private redirectBasedOnRole(role: string): void {
    // Délai pour permettre à l'utilisateur de voir le message de succès
    setTimeout(() => {
      switch (role) {
        case 'ADMIN':
          this.router.navigate(['/admin/dashboard']);
          break;
        case 'GERANT':
          this.router.navigate(['/manager/dashboard']);
          break;
        case 'CLIENT':
          this.router.navigate(['/client/dashboard']);
          break;
        default:
          this.router.navigate(['/dashboard']);
      }
    }, 1500);
  }

  /**
   * Redirection par défaut vers dashboard
   */
  private redirectToDashboard(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.redirectBasedOnRole(user.role);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Afficher un message de succès
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  /**
   * Afficher un message d'erreur
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  /**
   * Afficher un message d'information
   */
  private showInfo(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['info-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }
}