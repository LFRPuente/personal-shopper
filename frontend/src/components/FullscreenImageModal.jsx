import { V, c, useDialogFocus } from '../utils.js';

const FullscreenImageModal = V.memo(function FullscreenImageModal({
  fullscreenImage,
  overlayBackdropClass,
  overlaySheetClass,
  dismissActiveOverlayRef,
  getFullscreenImageUrl,
  handleFullscreenImageCopy,
}) {
  const dialogRef = V.useRef(null);
  useDialogFocus(dialogRef);
  if (!fullscreenImage) return null;

  const isCopyable = typeof fullscreenImage === 'object' && fullscreenImage && fullscreenImage.copyOnClick;
  const imageTitle = typeof fullscreenImage === 'object' && fullscreenImage && fullscreenImage.title
    ? fullscreenImage.title
    : 'Imagen ampliada';

  return c.jsx("div", {
    className: overlayBackdropClass(
      "fixed inset-0 z-[130] bg-black/85 flex items-center justify-center p-3 sm:p-4 ui-backdrop",
      "fullscreen-image",
    ),
    onClick: () => dismissActiveOverlayRef.current(),
    children: c.jsxs("div", {
      ref: dialogRef,
      role: "dialog",
      "aria-modal": true,
      "aria-labelledby": "fullscreen-image-title",
      tabIndex: -1,
      className: overlaySheetClass(
        "relative flex max-h-[calc(100dvh-2rem)] max-w-[calc(100dvw-1.5rem)] flex-col items-center justify-center ui-sheet sm:max-w-[calc(100dvw-2rem)]",
        "fullscreen-image",
      ),
      onClick: (event) => event.stopPropagation(),
      children: [
        c.jsx("h2", {
          id: "fullscreen-image-title",
          className: "sr-only",
          children: imageTitle,
        }),
        c.jsxs("div", {
          className: "absolute -top-11 right-0 flex items-center gap-2",
          children: [
            c.jsx("a", {
              href: getFullscreenImageUrl(fullscreenImage),
              target: "_blank",
              rel: "noreferrer",
              className:
                "px-3 py-1.5 rounded-full bg-white text-gray-700 text-xs font-bold border border-gray-200 shadow hover:bg-gray-100",
              children: "Abrir enlace",
            }),
            c.jsx("button", {
              "data-dialog-initial-focus": true,
              "aria-label": "Cerrar imagen ampliada",
              onClick: () => dismissActiveOverlayRef.current(),
              className:
                "w-9 h-9 rounded-full bg-white text-gray-700 border border-gray-200 flex items-center justify-center shadow",
              children: c.jsx("span", {
                className: "material-symbols-outlined",
                children: "close",
              }),
            }),
          ],
        }),
        c.jsxs("div", {
          className: "relative min-w-0",
          children: [
            c.jsx("img", {
              src: getFullscreenImageUrl(fullscreenImage),
              alt: imageTitle,
              role: isCopyable ? 'button' : undefined,
              tabIndex: isCopyable ? 0 : undefined,
              "aria-label": isCopyable ? `${imageTitle}. Presiona Enter para copiarla.` : undefined,
              className: `block max-h-[calc(100dvh-5.5rem)] max-w-[calc(100dvw-1.5rem)] object-contain rounded-xl bg-black sm:max-w-[calc(100dvw-2rem)] ${typeof fullscreenImage == "object" && fullscreenImage && fullscreenImage.copyOnClick ? "cursor-copy" : ""}`,
              onClick: () => handleFullscreenImageCopy(),
              onKeyDown: (event) => {
                if (!isCopyable || (event.key !== 'Enter' && event.key !== ' ')) return;
                event.preventDefault();
                handleFullscreenImageCopy();
              },
              onError: (event) => {
                event.currentTarget.style.display = "none";
              },
            }),
            typeof fullscreenImage == "object" &&
              fullscreenImage &&
              fullscreenImage.title &&
              c.jsxs("div", {
                className: "pointer-events-none absolute inset-x-2 bottom-2 rounded-lg bg-slate-950/92 px-3 py-2 text-left text-white shadow-lg",
                children: [
                c.jsx("p", {
                    className: "truncate text-sm font-bold",
                    children: fullscreenImage.title,
                  }),
                  Array.isArray(fullscreenImage.details) &&
                    fullscreenImage.details.length > 0 &&
                    c.jsx("p", {
                      className: "mt-0.5 truncate text-xs font-medium text-slate-200",
                      children: fullscreenImage.details.join(" · "),
                    }),
                ],
              }),
          ],
        }),
        typeof fullscreenImage == "object" &&
          fullscreenImage &&
          fullscreenImage.copyOnClick &&
          c.jsx("p", {
            className: "mt-3 text-center text-xs font-medium text-white/80",
            children: "Toca la imagen para copiarla.",
          }),
      ],
    }),
  });
});

export default FullscreenImageModal;
