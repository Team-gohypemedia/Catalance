import { useEffect, useRef, useState } from "react";

const DEFAULT_ASPECT_RATIO = 16 / 9;
const GREEN_DOMINANCE_THRESHOLD = 22;
const KEY_SOFTNESS = 42;
const KEY_TOLERANCE = 118;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const blendColor = (current, target, weight) => ({
  r: current.r + (target.r - current.r) * weight,
  g: current.g + (target.g - current.g) * weight,
  b: current.b + (target.b - current.b) * weight,
});

const sampleBackgroundColor = (data, width, height) => {
  const sampleSize = Math.max(4, Math.floor(Math.min(width, height) * 0.04));
  const regions = [
    { x: 0, y: 0 },
    { x: Math.max(0, width - sampleSize), y: 0 },
    { x: 0, y: Math.max(0, height - sampleSize) },
  ];

  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let count = 0;

  for (const { x: originX, y: originY } of regions) {
    const startX = Math.max(0, Math.min(width - 1, originX));
    const startY = Math.max(0, Math.min(height - 1, originY));
    const endX = Math.min(width, startX + sampleSize);
    const endY = Math.min(height, startY + sampleSize);

    for (let y = startY; y < endY; y += 1) {
      for (let x = startX; x < endX; x += 1) {
        const index = (y * width + x) * 4;
        totalR += data[index];
        totalG += data[index + 1];
        totalB += data[index + 2];
        count += 1;
      }
    }
  }

  if (!count) {
    return { r: 0, g: 255, b: 0 };
  }

  return {
    r: totalR / count,
    g: totalG / count,
    b: totalB / count,
  };
};

const applyChromaKey = (data, keyColor) => {
  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const alpha = data[index + 3];

    if (alpha === 0) {
      continue;
    }

    const greenDominance = green - Math.max(red, blue);
    if (greenDominance < GREEN_DOMINANCE_THRESHOLD) {
      continue;
    }

    const distance = Math.sqrt(
      (red - keyColor.r) * (red - keyColor.r) +
      (green - keyColor.g) * (green - keyColor.g) +
      (blue - keyColor.b) * (blue - keyColor.b),
    );

    const keySimilarity = 1 - clamp((distance - KEY_SOFTNESS) / (KEY_TOLERANCE - KEY_SOFTNESS), 0, 1);
    const dominanceSimilarity = clamp((greenDominance - GREEN_DOMINANCE_THRESHOLD) / 90, 0, 1);
    const transparency = clamp(Math.max(keySimilarity, dominanceSimilarity), 0, 1);

    if (transparency > 0) {
      data[index + 3] = Math.round(alpha * (1 - transparency));
    }
  }
};

const ChromaKeyVideo = ({ src, className = "", style }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [aspectRatio, setAspectRatio] = useState(DEFAULT_ASPECT_RATIO);
  const [canKey, setCanKey] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      return undefined;
    }

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      setCanKey(false);
      return undefined;
    }

    let cancelled = false;
    let frameRequestId = 0;
    let keyColor = { r: 0, g: 255, b: 0 };
    let hasSample = false;

    const syncDimensions = () => {
      if (!video.videoWidth || !video.videoHeight) {
        return;
      }

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        setAspectRatio(video.videoWidth / video.videoHeight);
      }
    };

    const scheduleFrame = () => {
      if (cancelled) {
        return;
      }

      if (typeof video.requestVideoFrameCallback === "function") {
        video.requestVideoFrameCallback(renderFrame);
        return;
      }

      frameRequestId = window.requestAnimationFrame(renderFrame);
    };

    function renderFrame() {
      if (cancelled || !video.videoWidth || !video.videoHeight) {
        scheduleFrame();
        return;
      }

      syncDimensions();
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const frame = context.getImageData(0, 0, canvas.width, canvas.height);
      const sampledColor = sampleBackgroundColor(frame.data, canvas.width, canvas.height);
      keyColor = hasSample ? blendColor(keyColor, sampledColor, 0.14) : sampledColor;
      hasSample = true;

      applyChromaKey(frame.data, keyColor);
      context.putImageData(frame, 0, 0);

      scheduleFrame();
    }

    const handleLoadedMetadata = () => {
      syncDimensions();
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    void video.play().catch(() => {});
    scheduleFrame();

    return () => {
      cancelled = true;
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);

      if (frameRequestId) {
        window.cancelAnimationFrame(frameRequestId);
      }

      video.pause();
    };
  }, [src, canKey]);

  if (!canKey) {
    return (
      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className={`block w-full select-none object-contain ${className}`.trim()}
        style={style}
      />
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`.trim()}
      style={{ aspectRatio, ...style }}
    >
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 h-full w-full opacity-0 pointer-events-none"
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="block h-full w-full select-none"
      />
    </div>
  );
};

export default ChromaKeyVideo;