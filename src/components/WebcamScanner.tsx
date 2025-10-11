import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle, Settings, Zap } from 'lucide-react';
import { decodeBarcodeData } from '../lib/barcode';

interface WebcamScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  title?: string;
}

export function WebcamScanner({ onScan, onClose, title = "Webcam Barcode Scanner" }: WebcamScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerClearedRef = useRef<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [scannerMode, setScannerMode] = useState<'auto' | 'manual'>('auto');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    // Get available cameras
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        setCameras(devices);
        setSelectedCamera(devices[0].id);
      }
    }).catch(err => {
      console.error('Error getting cameras:', err);
      setError('Unable to access camera devices');
    });

    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (scannerMode === 'auto') {
      startAutoScanner();
    } else {
      startManualScanner();
    }

    return () => {
      cleanup();
    };
  }, [scannerMode, selectedCamera]);

  const cleanup = () => {
    if (scannerRef.current && !scannerClearedRef.current) {
      scannerClearedRef.current = true;
      scannerRef.current.clear().catch(console.error);
    }
    if (html5QrCodeRef.current && isScanning) {
      html5QrCodeRef.current.stop().catch(console.error);
      setIsScanning(false);
    }
  };

  const startAutoScanner = () => {
    cleanup();
    scannerClearedRef.current = false;
    
    const scanner = new Html5QrcodeScanner(
      "webcam-scanner",
      {
        fps: 10,
        qrbox: { width: 350, height: 200 },
        aspectRatio: 1.777778,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 2,
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
  };

  const startManualScanner = () => {
    if (!selectedCamera) return;
    
    cleanup();
    
    const html5QrCode = new Html5Qrcode("webcam-scanner-manual");
    html5QrCodeRef.current = html5QrCode;

    const config = {
      fps: 10,
      qrbox: { width: 350, height: 200 },
      aspectRatio: 1.777778,
    };

    html5QrCode.start(
      selectedCamera,
      config,
      (decodedText) => {
        html5QrCode.stop().then(() => {
          setIsScanning(false);
          // Try to decode barcode data for enhanced information
          const barcodeData = decodeBarcodeData(decodedText);
          if (barcodeData) {
            console.log('Decoded barcode data:', barcodeData);
          }
          onScan(decodedText);
        }).catch(console.error);
      },
      (error) => {
        // Handle scan errors silently
        console.debug('Manual scan error:', error);
      }
    ).then(() => {
      setIsScanning(true);
      setError(null);
    }).catch(err => {
      console.error('Error starting manual scanner:', err);
      setError('Failed to start camera. Please check permissions.');
      setIsScanning(false);
    });
  };

  const switchCamera = (cameraId: string) => {
    setSelectedCamera(cameraId);
  };

  const toggleScannerMode = () => {
    setScannerMode(prev => prev === 'auto' ? 'manual' : 'auto');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Camera className="h-6 w-6 text-indigo-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleScannerMode}
              className={`flex items-center px-3 py-1 text-xs rounded-full transition duration-200 ${
                scannerMode === 'auto' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}
              title={`Switch to ${scannerMode === 'auto' ? 'manual' : 'auto'} mode`}
            >
              {scannerMode === 'auto' ? <Zap className="h-3 w-3 mr-1" /> : <Settings className="h-3 w-3 mr-1" />}
              {scannerMode === 'auto' ? 'Auto' : 'Manual'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Camera Selection */}
          {scannerMode === 'manual' && cameras.length > 1 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Camera:
              </label>
              <select
                value={selectedCamera}
                onChange={(e) => switchCamera(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {cameras.map((camera) => (
                  <option key={camera.id} value={camera.id}>
                    {camera.label || `Camera ${camera.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Instructions */}
          <div className="mb-4">
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <AlertCircle className="h-4 w-4 mr-1" />
              {scannerMode === 'auto' 
                ? 'Position the barcode within the scanning area. The scanner will automatically detect codes.'
                : 'Click start to begin scanning. Position the barcode clearly in view.'
              }
            </div>
            <div className="text-xs text-gray-500">
              • Ensure good lighting for best results
              • Hold the barcode steady and flat
              • Try different distances if scanning fails
            </div>
          </div>

          {/* Scanner Container */}
          <div className="relative">
            {scannerMode === 'auto' ? (
              <div id="webcam-scanner" className="w-full"></div>
            ) : (
              <div>
                <div id="webcam-scanner-manual" className="w-full"></div>
                {!isScanning && selectedCamera && (
                  <div className="text-center mt-4">
                    <button
                      onClick={startManualScanner}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
                    >
                      Start Camera
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
              <div className="mt-2 text-xs text-red-500">
                • Check camera permissions in your browser
                • Ensure camera is not being used by another application
                • Try refreshing the page if issues persist
              </div>
            </div>
          )}

          {/* Scanner Status */}
          {scannerMode === 'manual' && (
            <div className="mt-4 text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                isScanning 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  isScanning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`}></div>
                {isScanning ? 'Scanning...' : 'Camera Stopped'}
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
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