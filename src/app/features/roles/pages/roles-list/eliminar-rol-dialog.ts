import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { DialogShell } from '@/shared/components/dialog-shell/dialog-shell';

@Component({
  selector: 'app-eliminar-rol-dialog',
  imports: [DialogShell],
  template: `
    <app-dialog-shell
      title="Eliminar rol"
      titleId="eliminar-rol-title"
      eyebrow="Administración / Accesos"
      description="Esta acción no se puede deshacer."
      (closed)="cerrar()"
    >
      <div class="p-6">
        <p id="eliminar-rol-description" class="text-sm leading-relaxed">
          ¿Quieres eliminar el rol <strong>{{ data.nombre }}</strong
          >? Solo se puede eliminar si no está asignado a ningún usuario.
        </p>
        <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            id="cancelar-eliminar-rol"
            class="btn bg-base-300"
            type="button"
            (click)="cerrar()"
          >
            Cancelar
          </button>
          <button class="btn btn-error" type="button" (click)="confirmar()">Eliminar rol</button>
        </div>
      </div>
    </app-dialog-shell>
  `,
})
export class EliminarRolDialog {
  protected readonly data = inject<{ nombre: string }>(DIALOG_DATA);
  private readonly dialog = inject<DialogRef<boolean>>(DialogRef);

  protected cerrar() {
    this.dialog.close(false);
  }
  protected confirmar() {
    this.dialog.close(true);
  }
}
