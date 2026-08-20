import toast from 'react-hot-toast';

export const copiarAlPortapapeles = async (texto: string, mensajeExito = 'Enlace copiado al portapapeles') => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = texto;
      // Evitar scroll visual al añadir el textarea
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    }
    toast.success(mensajeExito);
  } catch (err) {
    console.error('Error al copiar:', err);
    toast.error('No se pudo copiar al portapapeles.');
  }
};

export const maskDocument = (doc: string | number | undefined | null) => {
  if (!doc) return '';
  const docStr = doc.toString();
  if (docStr.length <= 4) return `****${docStr}`;
  return `****${docStr.slice(-4)}`;
};
