import { V, c } from '../utils.js';

const FullscreenImageModal = V.memo(function FullscreenImageModal({
  fullscreenImage,
  overlayBackdropClass,
  overlaySheetClass,
  dismissActiveOverlayRef,
  getFullscreenImageUrl,
  handleFullscreenImageCopy,
}) {
  if (!fullscreenImage) return null;

  return c.jsx("div", {
    className: overlayBackdropClass(
      "fixed inset-0 z-[80] bg-black/85 flex items-center justify-center p-4 ui-backdrop",
      "fullscreen-image",
    ),
    onClick: () => dismissActiveOverlayRef.current(),
    children: c.jsxs("div", {
      className: overlaySheetClass(
        "relative max-w-[95vw] max-h-[90vh] ui-sheet",
        "fullscreen-image",
      ),
      onClick: (event) => event.stopPropagation(),
      children: [
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
        c.jsx("img", {
          src: getFullscreenImageUrl(fullscreenImage),
          className: `max-w-[95vw] max-h-[90vh] object-contain rounded-xl bg-black ${typeof fullscreenImage == "object" && fullscreenImage && fullscreenImage.copyOnClick ? "cursor-copy" : ""}`,
          onClick: () => handleFullscreenImageCopy(),
          onError: (event) => {
            event.currentTarget.style.display = "none";
          },
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
