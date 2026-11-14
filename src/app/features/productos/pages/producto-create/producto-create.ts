import { Component, computed, effect, inject, OnDestroy, signal } from '@angular/core';
import { form, FormField, required, min, maxLength, pattern, disabled } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { injectMutation, injectQuery } from '@tanstack/angular-query-experimental';
import { AuthService } from '@/core/auth/auth.service';
import { apiErrorMessage } from '@/core/errors/api-error';
import { ImageDropzone } from '@/shared/components/image-dropzone/image-dropzone';
import { NumberField } from '@/shared/components/number-field/number-field';
import { UnidadSecundaria } from './unidad-secundaria/unidad-secundaria';
import { TextField } from '@/shared/components/text-field/text-field';
import { SelectField } from '@/shared/components/select-field/select-field';
import { ProductosQueries } from '../../queries/productos.queries';
import { ProductosMutations } from '../../queries/productos.mutations';

@Component({
  selector: 'app-producto-create',
  imports: [FormField, RouterLink, TextField, SelectField, NumberField, UnidadSecundaria, ImageDropzone],
  templateUrl: './producto-create.html',
})
export class ProductoCreatePage implements OnDestroy {
  private readonly queries = inject(ProductosQueries);
  private readonly mutations = inject(ProductosMutations);
  private readonly route = inject(ActivatedRoute);
  protected readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly detalle = injectQuery(() => this.queries.obtener(this.id));
  protected readonly editar = injectMutation(() => this.mutations.editar());
  private inicializado = false;
  protected existentes: { id: string; url: string }[] = [];
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  protected readonly marcas = injectQuery(() => this.queries.catalogo('marcas'));
  protected readonly categorias = injectQuery(() => this.queries.catalogo('categorias'));
  protected readonly unidades = injectQuery(() => this.queries.catalogo('unidades-medida'));
  protected readonly opcionesMarcas = computed(() => [{ value: '', label: 'Selecciona una marca' }, ...(this.marcas.data() ?? []).map(x => ({ value: x.id, label: x.nombre }))]);
  protected readonly opcionesUnidades = computed(() => [{ value: '', label: 'Selecciona una unidad' }, ...(this.unidades.data() ?? []).map(x => ({ value: x.id, label: x.nombre }))]);
  protected readonly guardar = injectMutation(() => this.mutations.crear());
  protected readonly error = signal('');
  protected readonly modelo = signal({ nombre: '', marcaId: '', precio: null as number | null, stock: null as number | null, stockMinimo: 0 as number | null, sku: '', codigoBarras: '', principal: '' });
  protected readonly formulario = form(this.modelo, path => {
    required(path.nombre, { message: 'Ingresa el nombre.' }); pattern(path.nombre, /\S/, { message: 'Ingresa un nombre válido.' }); maxLength(path.nombre, 150);
    required(path.marcaId, { message: 'Selecciona una marca.' }); required(path.principal, { message: 'Selecciona una unidad.' }); disabled(path.principal, () => !!this.id);
    required(path.precio, { message: 'Ingresa el precio.' }); min(path.precio, 0, { message: 'El precio no puede ser negativo.' }); required(path.stock, { message: 'Ingresa el stock.' }); min(path.stock, 0, { message: 'El stock no puede ser negativo.' });
    required(path.stockMinimo, { message: 'Ingresa el stock mínimo.' }); min(path.stockMinimo, 0, { message: 'El stock mínimo no puede ser negativo.' });
    maxLength(path.sku, 100); maxLength(path.codigoBarras, 100);
  });
  protected categoriaIds: string[] = [];
  protected secundarias: { unidadId: string; factor: number | null }[] = [];
  protected imagenes: { file: File; url: string }[] = [];
  constructor() {
    effect(() => {
      const p = this.detalle.data();
      if (!p || this.inicializado || p.id !== this.id) return;
      this.inicializado = true;
      this.formulario().reset({ nombre: p.nombre, marcaId: p.marcaId, precio: Number(p.precio), stock: Number(p.stock), stockMinimo: Number(p.stockMinimo), sku: p.sku ?? '', codigoBarras: p.codigoBarras ?? '', principal: p.unidades.find(u => u.principal)?.unidadId ?? '' });
      this.categoriaIds = [...p.categoriaIds];
      this.secundarias = p.unidades
        .filter((u) => !u.principal)
        .map((u) => ({ unidadId: u.unidadId, factor: Number(u.factor) }));
      this.existentes = [...p.imagenes];
    });
  }
  protected categoria(id: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.categoriaIds = checked
      ? [...this.categoriaIds, id]
      : this.categoriaIds.filter((x) => x !== id);
  }
  protected agregarUnidad() {
    this.secundarias.push({ unidadId: '', factor: null });
  }
  protected quitarUnidad(index: number) {
    this.secundarias.splice(index, 1);
  }
  protected seleccionarImagenes(archivos: File[]) {
    if (!archivos.length) return;
    if (
      this.existentes.length + this.imagenes.length + archivos.length > 10 ||
      archivos.some(
        (f) => f.size > 500 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(f.type),
      )
    ) {
      this.error.set('Selecciona hasta 10 imágenes JPG, PNG o WebP de máximo 500 KB cada una.');
      return;
    }
    this.error.set('');
    this.imagenes.push(...archivos.map((file) => ({ file, url: URL.createObjectURL(file) })));
  }
  protected quitarImagen(index: number) {
    URL.revokeObjectURL(this.imagenes[index].url);
    this.imagenes.splice(index, 1);
  }
  ngOnDestroy() {
    this.imagenes.forEach((i) => URL.revokeObjectURL(i.url));
  }
  protected enviar() {
    this.formulario().markAsTouched();
    const { nombre, marcaId, precio, stock, stockMinimo, sku, codigoBarras, principal } = this.modelo();
    const ids = [principal, ...this.secundarias.map((u) => u.unidadId)];
    if (
      this.formulario().invalid() ||
      !nombre.trim() ||
      !marcaId ||
      precio === null ||
      stock === null ||
      stockMinimo === null ||
      !Number.isFinite(precio) ||
      !Number.isFinite(stock) ||
      !Number.isFinite(stockMinimo) ||
      precio < 0 ||
      stock < 0 ||
      stockMinimo < 0 ||
      ids.some((id) => !id) ||
      new Set(ids).size !== ids.length ||
      this.secundarias.some((u) => u.factor === null || !Number.isFinite(u.factor) || u.factor <= 0)
    ) {
      this.error.set(
        'Completa los campos obligatorios y verifica que las unidades no se repitan y sus factores sean mayores que cero.',
      );
      return;
    }
    this.error.set('');
    const data = new FormData();
    data.append(
      'data',
      JSON.stringify({
        ...(this.id ? { imagenIds: this.existentes.map((i) => i.id) } : {}),
        nombre: nombre.trim(),
        marcaId: marcaId,
        precio: precio,
        stock: stock,
        stockMinimo: stockMinimo,
        sku: sku.trim(),
        codigoBarras: codigoBarras.trim(),
        categoriaIds: this.categoriaIds,
        unidades: [
          { unidadId: principal, principal: true, factor: 1 },
          ...this.secundarias.map((u) => ({ ...u, principal: false })),
        ],
      }),
    );
    this.imagenes.forEach((i) => data.append('imagenes', i.file));
    const version = this.auth.sessionVersion;
    const callbacks = {
      onSuccess: () => {
        if (version === this.auth.sessionVersion) void this.router.navigate(['/admin/productos']);
      },
      onError: (error: unknown) => {
        if (version === this.auth.sessionVersion)
          this.error.set(
            apiErrorMessage(
              error,
              'No se pudo guardar el producto. Verifica los datos y los identificadores.',
            ),
          );
      },
    };
    if (this.id) this.editar.mutate({ id: this.id, data }, callbacks);
    else this.guardar.mutate(data, callbacks);
  }
}
