"use client";
import React, { useEffect, useRef } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";

interface QrScannerProps {
  onScan: (data: string) => void;
  onError?: (err: any) => void;
}

export function QrScanner({ onScan, onError }: QrScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
      },
      false
    );

    let isScanned = false;

    scannerRef.current.render(
      (text) => {
        if (!isScanned) {
          isScanned = true;
          onScan(text);
          if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
          }
        }
      },
      (err) => {
        if (onError) onError(err);
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScan, onError]);

  return (
    <div className="w-full flex justify-center">
      <div id="qr-reader" className="w-full max-w-sm overflow-hidden rounded-xl border border-red-500/30 bg-black/40 text-white [&>div]:!text-white [&>div>button]:ck-btn-secondary [&>div>button]:!text-xs [&>div>span>a]:!text-red-400 [&>div>span]:!text-zinc-400" />
    </div>
  );
}
