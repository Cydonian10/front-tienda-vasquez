import { TestBed } from '@angular/core/testing';
import { ImageDropzone } from './image-dropzone';

describe('ImageDropzone', () => {
  it('emite los archivos soltados y evita la navegación del navegador', () => {
    const fixture = TestBed.createComponent(ImageDropzone);
    fixture.componentRef.setInput('inputId', 'imagenes');
    const received: File[][] = [];
    fixture.componentInstance.filesChange.subscribe((files) => received.push(files));
    fixture.detectChanges();
    const file = new File(['image'], 'foto.png', { type: 'image/png' });
    const event = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'dataTransfer', { value: { files: [file] } });
    fixture.nativeElement.querySelector('div').dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(received).toEqual([[file]]);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('div').dispatchEvent(event);
    expect(received).toHaveLength(1);
  });
});
