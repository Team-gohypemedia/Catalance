const isMissing = (value) => value === undefined || value === null;
let pdfWorkerModulePromise = null;

class MinimalDOMMatrix {
  constructor(init = undefined) {
    if (Array.isArray(init) && init.length >= 6) {
      [this.a, this.b, this.c, this.d, this.e, this.f] = init;
      return;
    }

    if (init && typeof init === "object") {
      this.a = Number.isFinite(Number(init.a)) ? Number(init.a) : 1;
      this.b = Number.isFinite(Number(init.b)) ? Number(init.b) : 0;
      this.c = Number.isFinite(Number(init.c)) ? Number(init.c) : 0;
      this.d = Number.isFinite(Number(init.d)) ? Number(init.d) : 1;
      this.e = Number.isFinite(Number(init.e)) ? Number(init.e) : 0;
      this.f = Number.isFinite(Number(init.f)) ? Number(init.f) : 0;
      return;
    }

    this.a = 1;
    this.b = 0;
    this.c = 0;
    this.d = 1;
    this.e = 0;
    this.f = 0;
  }

  multiplySelf(other) {
    const matrix = other instanceof MinimalDOMMatrix ? other : new MinimalDOMMatrix(other);
    const a = this.a * matrix.a + this.c * matrix.b;
    const b = this.b * matrix.a + this.d * matrix.b;
    const c = this.a * matrix.c + this.c * matrix.d;
    const d = this.b * matrix.c + this.d * matrix.d;
    const e = this.a * matrix.e + this.c * matrix.f + this.e;
    const f = this.b * matrix.e + this.d * matrix.f + this.f;
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.e = e;
    this.f = f;
    return this;
  }

  preMultiplySelf(other) {
    const matrix = other instanceof MinimalDOMMatrix ? other : new MinimalDOMMatrix(other);
    const a = matrix.a * this.a + matrix.c * this.b;
    const b = matrix.b * this.a + matrix.d * this.b;
    const c = matrix.a * this.c + matrix.c * this.d;
    const d = matrix.b * this.c + matrix.d * this.d;
    const e = matrix.a * this.e + matrix.c * this.f + matrix.e;
    const f = matrix.b * this.e + matrix.d * this.f + matrix.f;
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.e = e;
    this.f = f;
    return this;
  }

  translateSelf(x = 0, y = 0) {
    this.e += Number(x) || 0;
    this.f += Number(y) || 0;
    return this;
  }

  scaleSelf(scaleX = 1, scaleY = scaleX) {
    this.a *= Number(scaleX) || 1;
    this.b *= Number(scaleX) || 1;
    this.c *= Number(scaleY) || 1;
    this.d *= Number(scaleY) || 1;
    return this;
  }

  rotateSelf() {
    return this;
  }

  invertSelf() {
    const det = this.a * this.d - this.b * this.c;
    if (!det) {
      return this;
    }

    const a = this.d / det;
    const b = -this.b / det;
    const c = -this.c / det;
    const d = this.a / det;
    const e = (this.c * this.f - this.d * this.e) / det;
    const f = (this.b * this.e - this.a * this.f) / det;

    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.e = e;
    this.f = f;
    return this;
  }

  static fromMatrix(matrix) {
    return new MinimalDOMMatrix(matrix);
  }
}

class MinimalImageData {
  constructor(dataOrWidth = 0, widthOrHeight = 0, height = 0) {
    if (typeof dataOrWidth === "number") {
      this.width = dataOrWidth;
      this.height = widthOrHeight;
      this.data = new Uint8ClampedArray(Math.max(0, this.width * this.height * 4));
      return;
    }

    this.data = dataOrWidth;
    this.width = widthOrHeight;
    this.height = height;
  }
}

class MinimalPath2D {
  constructor() {}
  addPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  bezierCurveTo() {}
  quadraticCurveTo() {}
  rect() {}
  roundRect() {}
  ellipse() {}
  arc() {}
  arcTo() {}
}

export const ensurePdfJsRuntime = () => {
  if (isMissing(globalThis.DOMMatrix)) {
    globalThis.DOMMatrix = MinimalDOMMatrix;
  }

  if (isMissing(globalThis.DOMMatrixReadOnly)) {
    globalThis.DOMMatrixReadOnly = globalThis.DOMMatrix;
  }

  if (isMissing(globalThis.ImageData)) {
    globalThis.ImageData = MinimalImageData;
  }

  if (isMissing(globalThis.Path2D)) {
    globalThis.Path2D = MinimalPath2D;
  }
};

export const loadPdfJsWorker = async () => {
  if (!pdfWorkerModulePromise) {
    pdfWorkerModulePromise = import("pdfjs-dist/legacy/build/pdf.worker.mjs");
  }

  const workerModule = await pdfWorkerModulePromise;
  if (workerModule?.WorkerMessageHandler) {
    globalThis.pdfjsWorker = {
      ...(globalThis.pdfjsWorker && typeof globalThis.pdfjsWorker === "object"
        ? globalThis.pdfjsWorker
        : {}),
      WorkerMessageHandler: workerModule.WorkerMessageHandler,
    };
  }

  return workerModule;
};
