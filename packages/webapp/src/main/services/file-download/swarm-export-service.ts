import JSZip from 'jszip';
import { GeneratorResult } from '@besser/wme';

export async function createCrewAIZip(result: GeneratorResult): Promise<Blob> {
  const zip = new JSZip();
  for (const file of result.files) {
    zip.file(file.filename, file.content);
  }
  return zip.generateAsync({ type: 'blob' });
}

export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}