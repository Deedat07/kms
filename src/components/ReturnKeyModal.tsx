import React, { useState } from 'react';
import { useIssueRecords } from '../hooks/useIssueRecords';
import { BarcodeScanner } from './BarcodeScanner';
import { X, Loader2, ArrowLeft, MessageSquare, QrCode, CheckCircle } from 'lucide-react';
import { decodeBarcodeData } from '../lib/barcode';

interface ReturnKeyModalProps {
  record: any;
  onClose: () => void;
}

export function ReturnKeyModal({ record, onClose }: ReturnKeyModalProps) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [barcodeVerified, setBarcodeVerified] = useState(false);
  const [scannedPayload, setScannedPayload] = useState<any>(null); // store decoded barcode payload
  const [scannedName, setScannedName] = useState<string | null>(null); // store user's name from QR code
  const { returnKey } = useIssueRecords();

  // Handle barcode scanning and decoding
  const handleBarcodeScanned = (scannedValue: string) => {
    const scanned = (scannedValue || '').toString().trim();
    let decoded = null;

    // Decode the barcode data
    try {
      decoded = decodeBarcodeData(scanned);
    } catch (e) {
      console.warn('decodeBarcodeData threw', e);
    }

    if (decoded && decoded.name) {
      // Set the decoded name from the QR code
      setScannedName(decoded.name);
      setScannedPayload(decoded);
      setBarcodeVerified(true); // Automatically mark as verified after name is scanned
      setError(null);
      setShowScanner(false);
    } else {
      setError('Unable to decode barcode or find user name in QR code.');
      setScannedName(null);
    }
  };

  const handleReturn = async () => {
    if (!barcodeVerified) {
      setError('Please scan the user\'s barcode to verify their identity before returning the key.');
      return;
    }

    setLoading(true);
    setError(null);

    const isPostAlert = record.status === 'overdue' || record.status === 'escalated';
    const returnNotes = isPostAlert
      ? `${notes || 'Key returned'} - Post-alert return (was ${record.status})`
      : notes;

    const payloadSummary = scannedPayload
      ? ` | scan:${JSON.stringify(scannedPayload, Object.keys(scannedPayload).slice(0, 5))}`
      : '';

    const { error: returnError } = await returnKey(record.id, `${returnNotes}${payloadSummary}`);

    if (returnError) {
      setError('Failed to return key. Please try again.');
    } else {
      onClose();
    }

    setLoading(false);
  };

  const isOverdue = new Date(record.due_at) < new Date();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Return Key</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Issue Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Issue Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">User:</span><span className="font-medium">{record.users?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Key:</span><span className="font-medium">{record.keys?.label}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Location:</span><span className="font-medium">{record.keys?.location}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Issued:</span><span className="font-medium">{new Date(record.issued_at).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Due:</span><span className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>{new Date(record.due_at).toLocaleDateString()}{isOverdue && ' (Overdue)'}</span></div>
            </div>
          </div>

          {/* Verification UI */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Identity Verification</h4>

            {!barcodeVerified ? (
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Please scan the user's barcode to verify identity before processing the return.
                </p>

                <div className="flex gap-2 items-center mb-3">
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Scan User Barcode
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center text-green-700">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">Identity verified: {scannedName}</span>
              </div>
            )}
          </div>

          {/* Return Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="h-4 w-4 inline mr-1" />
              Return Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              placeholder="Add any notes about the key return..."
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border rounded-lg text-gray-700">Cancel</button>
            <button onClick={handleReturn} disabled={loading || !barcodeVerified} className="flex-1 flex justify-center items-center px-4 py-3 rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-50">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Return Key
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showScanner && (
        <BarcodeScanner onScan={handleBarcodeScanned} onClose={() => setShowScanner(false)} title="Scan User Barcode to Verify Return" />
      )}
    </div>
  );
}
