import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { inCordova } from "../../shared/utils/in-cordova";

import css from "./camera.module.scss";

interface IProps {
  onPhoto: (url: string) => void;
  width: number;
  height: number;
}

const getResizedUrl = (canvasElement: HTMLCanvasElement, resizedSize: number) => {
  const type = "image/jpeg";
  const quality = 0.25;
  let url = canvasElement.toDataURL(type, quality);
  if (canvasElement.width > resizedSize) {
    const resizedCanvasElement = document.createElement("canvas");
    resizedCanvasElement.width = resizedSize;
    resizedCanvasElement.height = resizedSize;
    const resizedCanvas = resizedCanvasElement.getContext("2d");
    if (resizedCanvas) {
      resizedCanvas.drawImage(canvasElement, 0, 0, resizedSize, resizedSize);
      url = resizedCanvasElement.toDataURL(type, quality);
    }
  }
  return url;
};

export const Camera = (props: IProps) => {
  const camera = (window as any).plugin?.CanvasCamera;
  const [capturing, setCapturing] = useState(inCordova);
  const canvasClicked = useRef(false);
  const handleCanvasClicked = () => canvasClicked.current = true;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraButtonRef = useRef<HTMLDivElement>(null);
  const size = Math.min(props.height, props.width);
  const left = (props.width - size) / 2;

  useEffect(() => {
    if (inCordova) {
      if (canvasRef.current) {
        const canvasElement = canvasRef.current;
        const canvas = canvasElement.getContext("2d");

        if (canvas) {
          camera.initialize(canvasElement);
          camera.start({
            cameraFacing: "back",
            width: size,
            height: size,
            onAfterDraw: () => {
              if (canvasClicked.current) {
                const url = getResizedUrl(canvasElement, size);
                camera.stop();
                props.onPhoto(url);
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
          setCapturing(true);

          if (canvasRef.current) {
            const canvasElement = canvasRef.current;
            const canvas = canvasElement.getContext("2d");

            if (canvas) {
              canvasElement.height = size;
              canvasElement.width = size;
              canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
              if (canvasClicked.current) {
                const url = getResizedUrl(canvasElement, size);
                props.onPhoto(url);
                keepScanning = false;
              }
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

  const canvasStyle = {width: size, height: size, left};

  return (
    <div className={css.camera}>
      <div className={css.canvas} style={canvasStyle}>
        <canvas ref={canvasRef} />
        {capturing ? <div ref={cameraButtonRef} className={css.cameraButton} onClick={handleCanvasClicked} /> : undefined}
      </div>
    </div>
  );
};