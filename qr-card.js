// Dessine une carte QR code (QR + nom + sous-titre) dans un <canvas>.
// Dépend de qrcode.js (bibliothèque "qrcode-generator", licence MIT), à charger avant ce fichier.
(function (global) {
  "use strict";

  function fitFont(ctx, text, maxWidth, startSize, weight) {
    var size = startSize;
    while (size > 12) {
      ctx.font = weight + " " + size + "px Arial, Helvetica, sans-serif";
      if (ctx.measureText(text).width <= maxWidth) break;
      size -= 1;
    }
    return size;
  }

  // url : adresse encodée dans le QR ; title : nom de l'invité ; subtitle : ligne sous le nom.
  function makeQrCard(url, title, subtitle) {
    var qr = global.qrcode(0, "M");
    qr.addData(url);
    qr.make();

    var modules = qr.getModuleCount();
    var quiet = 4; // marge blanche réglementaire autour du QR
    var cell = Math.max(4, Math.floor(400 / (modules + quiet * 2)));
    var qrSize = (modules + quiet * 2) * cell;
    var width = Math.max(480, qrSize + 40);
    var top = 20;
    var height = top + qrSize + 100;

    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    var left = Math.round((width - qrSize) / 2);
    ctx.fillStyle = "#000000";
    for (var r = 0; r < modules; r++) {
      for (var c = 0; c < modules; c++) {
        if (qr.isDark(r, c)) {
          ctx.fillRect(left + (c + quiet) * cell, top + (r + quiet) * cell, cell, cell);
        }
      }
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    var maxText = width - 40;
    var y = top + qrSize + 34;

    ctx.fillStyle = "#1f3d2e";
    fitFont(ctx, title, maxText, 30, "bold");
    ctx.fillText(title, width / 2, y);

    if (subtitle) {
      ctx.fillStyle = "#6b6b6b";
      fitFont(ctx, subtitle, maxText, 18, "normal");
      ctx.fillText(subtitle, width / 2, y + 32);
    }
    return canvas;
  }

  global.makeQrCard = makeQrCard;
})(window);
