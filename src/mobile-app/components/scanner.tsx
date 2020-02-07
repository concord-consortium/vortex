import * as React from "react";
import { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";
import { Point } from "jsqr/dist/locator";

enum UploadState {
  NotScanning,
  Scanning,
  Uploading,
  UploadFailed,
  Uploaded
}

interface IProps {
  onScanned: (data: string) => void;
}

export const Scanner = (props: IProps) => {
  const [scanning, setScanning] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const video = document.createElement("video");

    const startVideo = () => {
      return new Promise((resolve, reject) => {
        const waitForMediaDevices = () => {
          if (navigator.mediaDevices) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
              .then((stream) => {
                video.srcObject = stream;
                video.setAttribute("playsinline", "true"); // required to tell iOS safari we don't want fullscreen
                video.play();
                resolve();
              });
          } else {
            requestAnimationFrame(waitForMediaDevices);
          }
        };
        waitForMediaDevices();
      });
    };

    const scanVideo = () => {
      let keepScanning = true;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        setScanning(true);

        if (canvasRef.current) {
          const canvasElement = canvasRef.current;
          const canvas = canvasElement.getContext("2d");

          if (canvas) {
            canvasElement.height = video.videoHeight;
            canvasElement.width = video.videoWidth;

            const drawLine = (begin: Point, end: Point, color: string) => {
              canvas.beginPath();
              canvas.moveTo(begin.x, begin.y);
              canvas.lineTo(end.x, end.y);
              canvas.lineWidth = 4;
              canvas.strokeStyle = color;
              canvas.stroke();
            };

            canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
            const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });
            if (code) {
              const isUrl = code.data.match(/^http/);
              const color = isUrl ? "#0f0" : "#f00";
              drawLine(code.location.topLeftCorner, code.location.topRightCorner, color);
              drawLine(code.location.topRightCorner, code.location.bottomRightCorner, color);
              drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, color);
              drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, color);
              if (isUrl) {
                props.onScanned(code.data);
                keepScanning = false;
              } else {
                drawLine(code.location.topLeftCorner, code.location.bottomRightCorner, color);
                drawLine(code.location.topRightCorner, code.location.bottomLeftCorner, color);
              }
            }
          }
        }
      }
      if (keepScanning) {
        requestAnimationFrame(scanVideo);
      }
    };

    startVideo().then(() => scanVideo());
  }, []);

  return (
    !scanning ? <div>⌛ Accessing camera ...</div> : <canvas ref={canvasRef} />
  );
};