// Ajustes que só valem dentro do aplicativo Android (Capacitor).
// Injetado pelo scripts/preparar-web.mjs em todas as páginas de mobile/www/.
(() => {
  const cap = window.Capacitor;
  if (!cap?.isNativePlatform?.()) return;

  // Exportações (CSV de emoções, JSON do Diário com IA, currículo do profissional)
  // criam um <a download href="blob:..."> e chamam click(). O WebView do Android
  // ignora esse download, então o arquivo é salvo no cache e aberto no compartilhar
  // do sistema, onde a pessoa escolhe salvar ou enviar.
  const blobs = new Map();
  const createObjectURL = URL.createObjectURL.bind(URL);
  const revokeObjectURL = URL.revokeObjectURL.bind(URL);
  URL.createObjectURL = (object) => {
    const url = createObjectURL(object);
    if (object instanceof Blob) blobs.set(url, object);
    return url;
  };
  URL.revokeObjectURL = (url) => {
    blobs.delete(url);
    revokeObjectURL(url);
  };

  const readBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

  const shareFile = async (blob, fileName) => {
    try {
      const data = await readBase64(blob);
      const { uri } = await cap.nativePromise('Filesystem', 'writeFile', { path: fileName, data, directory: 'CACHE' });
      await cap.nativePromise('Share', 'share', { title: fileName, files: [uri], dialogTitle: 'Salvar ou enviar arquivo' });
    } catch (error) {
      if (/cancel/i.test(String(error?.message))) return;
      console.error('Exportação no app falhou:', error);
      window.alert('Não foi possível exportar o arquivo agora. Tente de novo em instantes.');
    }
  };

  const click = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    const blob = this.download && blobs.get(this.href);
    if (!blob) return click.call(this);
    shareFile(blob, this.download);
  };
})();
