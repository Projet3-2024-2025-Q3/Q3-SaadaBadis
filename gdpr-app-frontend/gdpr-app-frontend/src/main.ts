// src/main.ts - Configuration avec providers
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http'; // Provider moderne
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(), // Provider HttpClient pour toute l'application
    provideAnimations(), // Pour Angular Material
    // Autres providers globaux
  ]
}).catch(err => console.error(err));