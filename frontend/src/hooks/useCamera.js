import { useRef, useState } from 'react';

export const useCamera = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error('Error accessing camera:', err);
      throw new Error('Error accessing camera');
    }
  };

  const captureImage = () => {
    if (!canvasRef.current || !videoRef.current) return null;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/png');
    return dataURLtoBlob(imageData);
  };

  const dataURLtoBlob = (dataURL) => {
    const parts = dataURL.split(',');
    const byteString = atob(parts[1]);
    const mimeString = parts[0].split(':')[1].split(';')[0];
    const ia = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ia], { type: mimeString });
  };

  return {
    videoRef,
    canvasRef,
    startCamera,
    captureImage,
  };
};
