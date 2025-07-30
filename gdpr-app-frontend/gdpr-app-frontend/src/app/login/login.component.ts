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
    MatDividerModule
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

  constructor(private router: Router) {}

  /**
   * Gestionnaire de soumission du formulaire de connexion
   */
  onSubmit(): void {
    // Empêcher les soumissions multiples
    if (this.isLoading) return;

    // Réinitialiser l'état
    this.isLoading = true;
    this.errorMessage = '';

    console.log('Tentative de connexion:', {
      email: this.email,
      password: '***',
      rememberMe: this.rememberMe
    });

    // TODO: Remplacer par l'appel au service d'authentification
    // Simulation d'une requête d'authentification
    setTimeout(() => {
      this.isLoading = false;
      
      // Simulation d'une validation simple (à remplacer par votre logique)
      if (this.email === 'admin@gdpr.com' && this.password === 'admin123') {
        console.log('Connexion réussie !');
        // TODO: Sauvegarder le token d'authentification
        // TODO: Rediriger vers le dashboard
        // this.router.navigate(['/dashboard']);
        this.showSuccessMessage();
      } else {
        this.errorMessage = 'Email ou mot de passe incorrect. Essayez admin@gdpr.com / admin123';
      }
    }, 2000);
  }

  /**
   * Gestionnaire pour le mot de passe oublié
   */
  onForgotPassword(): void {
    console.log('Redirection vers la page mot de passe oublié');
    // TODO: Implémenter la navigation vers la page de récupération
    // this.router.navigate(['/forgot-password']);
    
    // Pour le moment, afficher une notification Material
    this.showInfoMessage('Fonctionnalité "Mot de passe oublié" - À implémenter');
  }

  /**
   * Gestionnaire pour l'inscription
   */
  onRegister(): void {
    console.log('Redirection vers la page d\'inscription');
    // TODO: Implémenter la navigation vers la page d'inscription
    // this.router.navigate(['/register']);
    
    // Pour le moment, afficher une notification Material
    this.showInfoMessage('Fonctionnalité "S\'inscrire" - À implémenter');
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
    return emailRegex.test(this.email);
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
   * Afficher un message de succès
   */
  private showSuccessMessage(): void {
    // TODO: Implémenter avec MatSnackBar pour un meilleur UX
    alert('Connexion réussie ! Redirection vers le dashboard...');
  }

  /**
   * Afficher un message d'information
   */
  private showInfoMessage(message: string): void {
    // TODO: Implémenter avec MatSnackBar pour un meilleur UX
    alert(message);
  }

  /**
   * Pré-remplir les champs pour les tests
   */
  fillDemoCredentials(): void {
    this.email = 'admin@gdpr.com';
    this.password = 'admin123';
  }
}