import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera, AlertCircle } from 'lucide-react';
import { decodeBarcodeData } from '../lib/barcode';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  title?: string;
}

export function BarcodeScanner({ onScan, onClose, title = "Scan User Barcode" }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerClearedRef = useRef<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    scannerClearedRef.current = false;
    
    const scanner = new Html5QrcodeScanner(
      "barcode-scanner",
      {
        fps: 10,
        qrbox: { width: 300, height: 150 },
        aspectRatio: 2.0
      },
      false
    );

    scanner.render(
      (decodedText) => {
        if (!scannerClearedRef.current) {
          scannerClearedRef.current = true;
          scanner.clear().then(() => {
            // Try to decode barcode data for enhanced information
            const barcodeData = decodeBarcodeData(decodedText);
            if (barcodeData) {
              console.log('Decoded barcode data:', barcodeData);
            }
            onScan(decodedText);
          }).catch(console.error);
        }
      },
      (error) => {
        // Handle scan errors silently - they're frequent during scanning
        console.debug('Scan error:', error);
      }
    );

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current && !scannerClearedRef.current) {
        scannerClearedRef.current = true;
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Camera className="h-6 w-6 text-indigo-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <AlertCircle className="h-4 w-4 mr-1" />
              Position the barcode within the scanning area
            </div>
          </div>

          <div id="barcode-scanner" className="w-full"></div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="mt-4 text-center">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}