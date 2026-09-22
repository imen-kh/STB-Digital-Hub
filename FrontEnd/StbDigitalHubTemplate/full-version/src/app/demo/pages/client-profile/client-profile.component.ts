import { Component, OnInit, inject, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { first } from 'rxjs';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import {
  ClientProfile,
  ClientProfileService
} from 'src/app/theme/shared/service/client-profile.service';
import { AuthenticationService } from 'src/app/theme/shared/service/authentication.service';

interface ProfileFormModel {
  firstName: string;
  lastName: string;
  telephone: string;
}

@Component({
  selector: 'app-client-profile',
  imports: [...SHARED_IMPORTS, FormField],
  templateUrl: './client-profile.component.html',
  styleUrl: './client-profile.component.scss'
})
export class ClientProfileComponent implements OnInit {
  private readonly profileService = inject(ClientProfileService);
  private readonly authenticationService = inject(AuthenticationService);

  loading = signal(true);
  saving = signal(false);
  uploading = signal(false);
  submitted = signal(false);
  error = signal('');
  success = signal('');
  profile = signal<ClientProfile | null>(null);
  previewUrl = signal<string | null>(null);

  formModel = signal<ProfileFormModel>({
    firstName: '',
    lastName: '',
    telephone: ''
  });

  profileForm = form(this.formModel, (schemaPath) => {
    required(schemaPath.firstName, { message: 'Le prénom est requis' });
    required(schemaPath.lastName, { message: 'Le nom est requis' });
    required(schemaPath.telephone, { message: 'Le téléphone est requis' });
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  get isTelephoneValid(): boolean {
    return /^\+?[0-9\s\-()]{8,20}$/.test(this.formModel().telephone.trim());
  }

  loadProfile(): void {
    this.loading.set(true);
    this.error.set('');
    this.profileService
      .getProfile()
      .pipe(first())
      .subscribe({
        next: (data) => {
          this.applyProfile(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(typeof err === 'string' ? err : 'Impossible de charger le profil.');
          this.loading.set(false);
        }
      });
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.error.set('');
    this.success.set('');

    if (!this.profileForm().valid() || !this.isTelephoneValid) {
      return;
    }

    this.saving.set(true);
    const payload = {
      firstName: this.formModel().firstName.trim(),
      lastName: this.formModel().lastName.trim(),
      telephone: this.formModel().telephone.trim()
    };

    this.profileService
      .updateProfile(payload)
      .pipe(first())
      .subscribe({
        next: (data) => {
          this.applyProfile(data);
          this.success.set('Profil mis à jour avec succès.');
          this.saving.set(false);
        },
        error: (err) => {
          this.error.set(typeof err === 'string' ? err : 'Mise à jour impossible.');
          this.saving.set(false);
        }
      });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.error.set('');
    this.success.set('');

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.error.set('Formats acceptés : JPG, PNG ou WEBP.');
      input.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.error.set('La photo ne doit pas dépasser 2 Mo.');
      input.value = '';
      return;
    }

    const localPreview = URL.createObjectURL(file);
    this.previewUrl.set(localPreview);
    this.uploading.set(true);

    this.profileService
      .uploadPhoto(file)
      .pipe(first())
      .subscribe({
        next: (data) => {
          this.applyProfile(data);
          this.success.set('Photo de profil mise à jour.');
          this.uploading.set(false);
          input.value = '';
        },
        error: (err) => {
          this.error.set(typeof err === 'string' ? err : "Échec de l'envoi de la photo.");
          this.uploading.set(false);
          input.value = '';
        }
      });
  }

  private applyProfile(data: ClientProfile): void {
    this.profile.set(data);
    this.previewUrl.set(data.photoUrl ?? null);
    this.formModel.set({
      firstName: data.firstName,
      lastName: data.lastName,
      telephone: data.telephone
    });
    this.authenticationService.syncProfile({
      firstName: data.firstName,
      lastName: data.lastName,
      photoUrl: data.photoUrl
    });
    this.previewUrl.set(this.authenticationService.currentUserAvatar());
  }

  formatDate(value?: string | null): string {
    if (!value) {
      return '—';
    }
    return new Date(value).toLocaleString('fr-FR');
  }

  statutLabel(statut?: string): string {
    switch (statut) {
      case 'Actif':
        return 'Actif';
      case 'EnAttente':
        return 'En attente';
      case 'Suspendu':
        return 'Suspendu';
      default:
        return statut || '—';
    }
  }
}
