export function compressImageFile(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !String(file.type).toLowerCase().startsWith("image/")) {
      resolve(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas to Blob failed"));
              return;
            }
            resolve(
              new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              }),
            );
          },
          file.type,
          quality,
        );
      };
      img.onerror = () => reject(new Error("Invalid image format"));
      img.src = event.target.result;
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export async function prepareCompressedImageFile(file, options = {}) {
  const maxWidth = options.maxWidth || 1200;
  const quality = typeof options.quality === "number" ? options.quality : 0.8;
  return compressImageFile(file, maxWidth, quality).catch(() => file);
}
