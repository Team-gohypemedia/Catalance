import { useEffect, useRef, useState } from "react";
import Camera from "lucide-react/dist/esm/icons/camera";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const stopStream = (stream) => {
  stream?.getTracks?.().forEach((track) => track.stop());
};

const createCapturedFileName = () => `profile-photo-${Date.now()}.jpg`;

export default function ProfilePhotoCameraDialog({
  open,
  onOpenChange,
  onCapture,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!open) {
      stopStream(streamRef.current);
      streamRef.current = null;
      setStatus("idle");
      setErrorMessage("");
      return undefined;
    }

    let isCancelled = false;

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("error");
        setErrorMessage("Camera access is not available in this browser.");
        return;
      }

      setStatus("starting");
      setErrorMessage("");

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: "user" },
        });

        if (isCancelled) {
          stopStream(stream);
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setStatus("ready");
      } catch (error) {
        setStatus("error");
        setErrorMessage(
          error?.name === "NotAllowedError"
            ? "Camera permission was blocked."
            : "Unable to open the camera.",
        );
      }
    };

    startCamera();

    return () => {
      isCancelled = true;
      stopStream(streamRef.current);
      streamRef.current = null;
    };
  }, [open]);

  const handleCapture = () => {
    const video = videoRef.current;

    if (!video || !video.videoWidth || !video.videoHeight) {
      setStatus("error");
      setErrorMessage("Camera is not ready yet.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      setStatus("error");
      setErrorMessage("Unable to capture this image.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setStatus("error");
          setErrorMessage("Unable to capture this image.");
          return;
        }

        onCapture(
          new File([blob], createCapturedFileName(), {
            type: "image/jpeg",
          }),
        );
        onOpenChange(false);
      },
      "image/jpeg",
      0.9,
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-black/10 dark:border-white/10 bg-white dark:bg-[#101010] p-0 text-black dark:text-white shadow-[0_24px_90px_rgba(0,0,0,0.15)] dark:shadow-[0_24px_90px_rgba(0,0,0,0.55)]">
        <DialogHeader className="px-5 pt-5 text-left">
          <DialogTitle className="text-base text-black dark:text-white">Take a picture</DialogTitle>
          <DialogDescription className="text-sm text-black/55 dark:text-white/55">
            Use your camera for the profile photo.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5">
          <div className="relative aspect-square overflow-hidden rounded-[18px] border border-black/10 dark:border-white/10 bg-black">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full scale-x-[-1] object-cover"
            />

            {status !== "ready" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 text-center text-sm text-white/70">
                {status === "starting" ? (
                  <>
                    <Loader2 className="size-5 animate-spin text-primary" />
                    <span>Opening camera...</span>
                  </>
                ) : status === "error" ? (
                  <>
                    <Camera className="size-6 text-primary" />
                    <span>{errorMessage}</span>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter className="gap-2 px-5 pb-5 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCapture}
            disabled={status !== "ready"}
            className="bg-primary text-black hover:bg-primary/90"
          >
            <Camera className="size-4" />
            Capture
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
