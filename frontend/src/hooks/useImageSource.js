import { V, resolveMediaUrl } from "../utils.js";

export async function convertBlobToPng(blob) {
  if (!blob) throw new Error("Invalid image blob");
  if (blob.type === "image/png") return blob;
  const url = URL.createObjectURL(blob);
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not decode image"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    const width = Math.max(1, image.naturalWidth || image.width || 1);
    const height = Math.max(1, image.naturalHeight || image.height || 1);
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas context unavailable");
    context.drawImage(image, 0, 0, width, height);
    return await new Promise((resolve, reject) => {
      canvas.toBlob(
        (pngBlob) => (pngBlob ? resolve(pngBlob) : reject(new Error("PNG conversion failed"))),
        "image/png",
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function dispatchImageSelection(onSelect, files = []) {
  const selectedFiles = Array.isArray(files) ? files.filter(Boolean) : [];
  if (selectedFiles.length > 0 && onSelect) {
    onSelect({ target: { files: selectedFiles, value: "" } });
  }
}

async function readClipboardImages(options = {}) {
  if (
    !navigator.clipboard ||
    typeof navigator.clipboard.read !== "function"
  ) {
    throw new Error("Clipboard image read is not supported in this browser.");
  }
  const multiple = !!options.multiple;
  const items = await navigator.clipboard.read();
  const files = [];
  for (const item of items) {
    for (const type of item.types || []) {
      if (!String(type || "").startsWith("image/")) continue;
      const blob = await item.getType(type);
      const extension = type.split("/")[1] || "png";
      files.push(
        new File([blob], `clipboard-image-${Date.now()}-${files.length + 1}.${extension}`, {
          type,
          lastModified: Date.now(),
        }),
      );
      if (!multiple) return files;
    }
  }
  return files;
}

async function writeImageBlobToClipboard(blob) {
  const type = blob.type && blob.type.startsWith("image/") ? blob.type : "image/png";
  if (
    !navigator.clipboard ||
    !navigator.clipboard.write ||
    typeof ClipboardItem === "undefined"
  ) {
    throw new Error("Clipboard image API not supported");
  }
  const candidates = [];
  try {
    const pngBlob = await convertBlobToPng(blob);
    candidates.push({ type: "image/png", blob: pngBlob });
  } catch {}
  if (type !== "image/png") candidates.push({ type, blob });
  if (type === "image/png") candidates.push({ type, blob });

  for (const candidate of candidates) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ [candidate.type]: candidate.blob }),
      ]);
      return;
    } catch {}
  }
  throw new Error("Clipboard image API not supported");
}

export function useImageSource({
  notifyInfo,
  notifyError,
  notifySuccess,
  setCopiedImageItemId,
}) {
  const [imageSourceDialog, setImageSourceDialog] = V.useState(null);
  const [imageSourceInfoOpen, setImageSourceInfoOpen] = V.useState(null);

  const openDeviceImagePicker = V.useCallback(
    (onSelect, options = {}) => {
      const multiple = !!options.multiple;
      const accept = String(options.accept || "image/*").trim() || "image/*";
      try {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = accept;
        input.multiple = multiple;
        input.style.position = "fixed";
        input.style.left = "-9999px";
        input.style.top = "-9999px";
        input.onchange = () => {
          const files = Array.from(input.files || []);
          if (files.length > 0) dispatchImageSelection(onSelect, files);
          input.remove();
        };
        document.body.appendChild(input);
        input.click();
      } catch (error) {
        console.error("Failed opening image picker", error);
        notifyError("No se pudo abrir el selector de imagen.");
      }
    },
    [notifyError],
  );

  const openImageSourcePicker = V.useCallback((onSelect, options = {}) => {
    const title = options.title || "Seleccionar imagen";
    const multiple = !!options.multiple;
    setImageSourceInfoOpen(null);
    setImageSourceDialog({
      title,
      description:
        options.description ||
        "Elige si quieres tomar la imagen del dispositivo o del portapapeles.",
      multiple,
      accept: String(options.accept || "image/*").trim() || "image/*",
      eyebrow: options.eyebrow || "Fuente de imagen",
      deviceLabel: options.deviceLabel || "Elegir del dispositivo",
      deviceDescription:
        options.deviceDescription ||
        (multiple
          ? "Abre tu galeria o archivos y selecciona una o varias imagenes."
          : "Abre tu galeria o archivos y selecciona una imagen."),
      clipboardLabel: options.clipboardLabel || "Usar portapapeles",
      clipboardDescription:
        options.clipboardDescription ||
        "Pega la imagen que ya copiaste y usala al instante sin buscar archivos.",
      onSelect,
    });
  }, []);

  const closeImageSourceDialog = V.useCallback(() => {
    setImageSourceDialog(null);
    setImageSourceInfoOpen(null);
  }, []);

  const pickImageFromDevice = V.useCallback(() => {
    const dialog = imageSourceDialog;
    if (!dialog || !dialog.onSelect) return;
    setImageSourceDialog(null);
    setImageSourceInfoOpen(null);
    openDeviceImagePicker(dialog.onSelect, {
      multiple: dialog.multiple,
      accept: dialog.accept,
    });
  }, [imageSourceDialog, openDeviceImagePicker]);

  const pickImageFromClipboard = V.useCallback(async () => {
    const dialog = imageSourceDialog;
    if (!dialog || !dialog.onSelect) return;
    setImageSourceDialog(null);
    setImageSourceInfoOpen(null);
    try {
      const files = await readClipboardImages({ multiple: dialog.multiple });
      if (!files.length) {
        notifyInfo("No se encontró ninguna imagen en el portapapeles.");
        return;
      }
      dispatchImageSelection(dialog.onSelect, files);
    } catch (error) {
      console.error("Failed reading clipboard image", error);
      notifyError(
        "No se pudo leer una imagen del portapapeles. Verifica permisos o copia una imagen primero.",
      );
    }
  }, [imageSourceDialog, notifyError, notifyInfo]);

  const copyProductImageToClipboard = V.useCallback(
    async (itemId, imageUrl) => {
      if (!imageUrl) return;
      const resolvedUrl = resolveMediaUrl(imageUrl);
      try {
        const response = await fetch(resolvedUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await writeImageBlobToClipboard(await response.blob());
        setCopiedImageItemId(itemId);
        setTimeout(() => setCopiedImageItemId(null), 2000);
      } catch (error) {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(resolvedUrl);
            setCopiedImageItemId(itemId);
            setTimeout(() => setCopiedImageItemId(null), 2000);
            notifyInfo(
              "Tu navegador no permite copiar imagen directa. Se copio el enlace de la imagen.",
            );
            return;
          }
        } catch {}
        console.error("Failed to copy image", error);
        notifyError("No se pudo copiar la imagen. Intenta en Chrome o Edge.");
      }
    },
    [notifyError, notifyInfo, setCopiedImageItemId],
  );

  const copyImageUrlToClipboard = V.useCallback(
    async (imageUrl, message = "Imagen copiada.") => {
      if (!imageUrl) return;
      try {
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await writeImageBlobToClipboard(await response.blob());
        notifySuccess(message);
      } catch (error) {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(imageUrl);
            notifyInfo(
              "Tu navegador no permite copiar imagen directa. Se copio el enlace de la imagen.",
            );
            return;
          }
        } catch {}
        console.error("Failed to copy image url", error);
        notifyError("No se pudo copiar la imagen. Intenta en Chrome o Edge.");
      }
    },
    [notifyError, notifyInfo, notifySuccess],
  );

  return {
    imageSourceDialog,
    imageSourceInfoOpen,
    setImageSourceInfoOpen,
    openImageSourcePicker,
    closeImageSourceDialog,
    pickImageFromDevice,
    pickImageFromClipboard,
    copyProductImageToClipboard,
    copyImageUrlToClipboard,
  };
}
