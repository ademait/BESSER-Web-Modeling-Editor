import JSZip from 'jszip';
import { GeneratorResult } from '@besser/wme';

export async function createSwarmZip(result: GeneratorResult): Promise<Blob> {
  const zip = new JSZip();
  for (const file of result.files) {
    zip.file(file.filename, file.content);
  }
  return zip.generateAsync({ type: 'blob' });
}

// TODO: Check if we need backward compatibility
export const createCrewAIZip = createSwarmZip;

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