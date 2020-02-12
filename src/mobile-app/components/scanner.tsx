import * as React from "react";
import { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";
import { Point } from "jsqr/dist/locator";
import { inCordova } from "../../shared/utils/in-cordova";

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
  const camera = (window as any).plugin.CanvasCamera;
  const [scanning, setScanning] = useState(inCordova);
  let canvasClicked = false;

  const handleCanvasClicked = () => canvasClicked = true;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const drawLine = (canvas: CanvasRenderingContext2D, begin: Point, end: Point, color: string) => {
      canvas.beginPath();
      canvas.moveTo(begin.x, begin.y);
      canvas.lineTo(end.x, end.y);
      canvas.lineWidth = 4;
      canvas.strokeStyle = color;
      canvas.stroke();
    };

    const findQRCode = (canvasElement: HTMLCanvasElement, canvas: CanvasRenderingContext2D, onFound?: () => void) => {
      let foundQRCode = false;
      const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      if (code) {
        const isUrl = code.data.match(/^http/);
        const color = isUrl ? "#0f0" : "#f00";
        drawLine(canvas, code.location.topLeftCorner, code.location.topRightCorner, color);
        drawLine(canvas, code.location.topRightCorner, code.location.bottomRightCorner, color);
        drawLine(canvas, code.location.bottomRightCorner, code.location.bottomLeftCorner, color);
        drawLine(canvas, code.location.bottomLeftCorner, code.location.topLeftCorner, color);
        if (isUrl) {
          debugger;
          onFound?.();
          props.onScanned(code.data);
          foundQRCode = false;
        } else {
          drawLine(canvas, code.location.topLeftCorner, code.location.bottomRightCorner, color);
          drawLine(canvas, code.location.topRightCorner, code.location.bottomLeftCorner, color);
        }
      }
      return foundQRCode;
    };

    if (inCordova) {
      if (canvasRef.current) {
        const canvasElement = canvasRef.current;
        const canvas = canvasElement.getContext("2d");

        const r = canvasElement.parentElement!.getBoundingClientRect();

        if (canvas) {
          camera.initialize(canvasElement);
          camera.start({
            cameraFacing: "back",
            width: r.width,
            height: r.width,
            onAfterDraw: () => {
              if (canvasClicked) {
                canvasClicked = false;
                findQRCode(canvasElement, canvas, () => camera.stop());
              }
            }
          });
        }
      }
    } else {
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
              canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
              keepScanning = !findQRCode(canvasElement, canvas);
            }
          }
        }
        if (keepScanning) {
          requestAnimationFrame(scanVideo);
        }
      };

      startVideo().then(() => scanVideo());
    }
  }, []);

  return (
    !scanning ? <div>Accessing camera ...</div> : <canvas onClick={handleCanvasClicked} ref={canvasRef} />
  );
};