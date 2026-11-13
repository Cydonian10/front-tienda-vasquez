import { HttpErrorResponse } from '@angular/common/http';
import { NgTemplateOutlet } from '@angular/common';
import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { injectMutation, injectQuery } from '@tanstack/angular-query-experimental';
import { debounceTime, distinctUntilChanged, finalize, map, Subject } from 'rxjs';
import { AuthService } from '@/core/auth/auth.service';
import { PerfilAccess } from '@/core/access-control/perfil-access';
import { PERMISOS } from '@/core/access-control/permissions';
import { apiErrorMessage } from '@/core/errors/api-error';
import { TextField } from '@/shared/components/text-field/text-field';
import { PersonaResumen, UsuarioDatos } from '../../models/usuario.model';
import { UsuariosQueries } from '../../queries/usuarios.queries';
import { UsuariosMutations } from '../../queries/usuarios.mutations';
import { LucideArrowLeft } from '@lucide/angular';

@Component({
  selector: 'app-usuario-form-page',
  imports: [TextField, NgTemplateOutlet, RouterLink, LucideArrowLeft],
  templateUrl: './usuario-form.html',
})
export class UsuarioFormPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly queries = inject(UsuariosQueries);
  private readonly mutations = inject(UsuariosMutations);
  protected readonly access = inject(PerfilAccess);
  protected readonly permisos = PERMISOS;
  protected readonly id = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('id') ?? '' },
  );
  protected readonly usuario = injectQuery(() => this.queries.obtener(this.id()));
  protected readonly actualizar = injectMutation(() => this.mutations.actualizar());
  protected readonly email = signal('');
  protected readonly nickname = signal('');
  protected readonly password = signal('');
  protected readonly persona = signal<PersonaResumen | null>(null);
  protected readonly mostrarPersonas = signal(!this.id());
  protected readonly personaSearch = signal('');
  protected readonly personaPage = signal(1);
  protected readonly personas = injectQuery(() =>
    this.queries.personas(
      this.personaPage(),
      this.personaSearch(),
      this.mostrarPersonas() && this.access.puede(PERMISOS.PERSONAS.LEER),
    ),
  );
  protected readonly creando = signal(false);
  protected readonly error = signal('');
  private readonly searchChanges = new Subject<string>();
  private initializedFor = '';

  constructor() {
    this.searchChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((value) => {
        this.personaPage.set(1);
        this.personaSearch.set(value.trim());
      });
    effect(() => {
      const user = this.usuario.data();
      if (!user || user.id !== this.id() || this.initializedFor === user.id) return;
      this.initializedFor = user.id;
      this.email.set(user.email);
      this.nickname.set(user.nickname);
      this.persona.set(user.persona);
    });
  }
  protected buscarPersona(event: Event) {
    this.searchChanges.next((event.target as HTMLInputElement).value);
  }
  protected elegirPersona(persona: PersonaResumen | null) {
    this.persona.set(persona);
    this.mostrarPersonas.set(!persona && !this.id());
  }
  protected back() {
    return this.access.puede(PERMISOS.USUARIOS.LEER) ? '/admin/usuarios' : '/admin';
  }

  protected volver() {
    if (!this.creando() && !this.actualizar.isPending()) void this.router.navigate([this.back()]);
  }

  protected guardar() {
    if (this.creando() || this.actualizar.isPending()) return;
    const editing = !!this.id();
    if (!this.access.puede(editing ? PERMISOS.USUARIOS.EDITAR : PERMISOS.USUARIOS.CREAR)) return;
    if (!editing && (!this.access.puede(PERMISOS.PERSONAS.LEER) || !this.persona())) {
      this.error.set('Selecciona una persona para crear el usuario.');
      return;
    }
    const datos: UsuarioDatos = {
      email: this.email().trim(),
      nickname: this.nickname().trim(),
      personaId: this.persona()?.id ?? null,
    };
    if (!datos.email || !datos.nickname) {
      this.error.set('Completa el correo y el nombre de usuario.');
      return;
    }
    if (!editing && this.password().length < 12) {
      this.error.set('Usa una contraseña de al menos 12 caracteres.');
      return;
    }
    this.error.set('');
    const version = this.auth.sessionVersion;
    if (editing) {
      if (!this.usuario.data()) return;
      this.actualizar.mutate(
        { id: this.id(), datos },
        {
          onSuccess: () => {
            if (!this.destroyRef.destroyed && version === this.auth.sessionVersion)
              void this.router.navigate([this.back()], {
                state: { usuarioMessage: 'Usuario actualizado correctamente.' },
              });
          },
          onError: (error) => {
            if (!this.destroyRef.destroyed && version === this.auth.sessionVersion)
              this.error.set(this.mensaje(error));
          },
        },
      );
      return;
    }
    this.creando.set(true);
    const request = this.mutations.crear({ ...datos, password: this.password() });
    // El secreto solo vive en el formulario y el cuerpo HTTP; nunca en la caché de TanStack.
    this.password.set('');
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.creando.set(false)),
      )
      .subscribe({
        next: () => {
          if (version === this.auth.sessionVersion)
            void this.router.navigate([this.back()], {
              state: {
                usuarioMessage: 'Usuario creado correctamente. Asígnale roles desde Información.',
              },
            });
        },
        error: (error: unknown) => {
          if (version === this.auth.sessionVersion)
            this.error.set(`${this.mensaje(error)} Ingresa nuevamente la contraseña.`);
        },
      });
  }
  private mensaje(error: unknown) {
    if (error instanceof HttpErrorResponse && error.status === 409)
      return 'El correo o la persona ya están asociados a otra cuenta.';
    if (error instanceof HttpErrorResponse && error.status === 400)
      return 'Revisa los datos ingresados y la persona seleccionada.';
    return apiErrorMessage(error, 'No se pudo guardar el usuario. Inténtalo nuevamente.');
  }
}
