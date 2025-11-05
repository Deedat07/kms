// src/components/MobileKeyScanner.tsx
import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useKeys } from '../hooks/useKeys';
import { useUsers } from '../hooks/useUsers';
import { useIssueRecords } from '../hooks/useIssueRecords';
import { 
  Smartphone, 
  QrCode, 
  User, 
  Key, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  X
} from 'lucide-react';
import { decodeBarcodeData } from '../lib/barcode';

interface MobileKeyScannerProps {
  onClose: () => void;
}

export function MobileKeyScanner({ onClose }: MobileKeyScannerProps) {
  const [scanMode, setScanMode] = useState<'user' | 'action'>('user');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [availableKeys, setAvailableKeys] = useState<any[]>([]);
  const [userActiveKeys, setUserActiveKeys] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [manualInput, setManualInput] = useState<string>('');
  const { keys } = useKeys();
  const { users } = useUsers();
  const { records, createIssueRecord, returnKey } = useIssueRecords();

  useEffect(() => {
    setAvailableKeys(keys.filter(key => key.status === 'available'));
  }, [keys]);

  useEffect(() => {
    if (selectedUser) {
      const activeRecords = records.filter(
        record => record.user_id === selectedUser.id && 
        (record.status === 'active' || record.status === 'overdue')
      );
      setUserActiveKeys(activeRecords);
    }
  }, [selectedUser, records]);

  const startScanning = () => {
    setScanning(true);
    setMessage('');

    const scanner = new Html5QrcodeScanner(
      "mobile-scanner",
      {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.777778
      },
      false
    );

    scanner.render(
      (decodedText) => {
        try { scanner.clear(); } catch {}
        setScanning(false);
        handleScanResult(decodedText);
      },
      (error) => {
        console.debug('Scan error:', error);
      }
    );
  };

  // Try atob safely (browser). If running in Node (backfill scripts), fallback Buffer.
  const tryAtob = (val: string) => {
    try {
      if (typeof atob === 'function') return atob(val);
      return Buffer.from(val, 'base64').toString('utf-8');
    } catch (e) {
      return null;
    }
  };

  const normalize = (s?: string) => s?.toString().trim() ?? '';

  const handleScanResult = (scanned: string) => {
    const barcode = normalize(scanned);
    if (!barcode) {
      setMessage('Empty scan result.');
      setMessageType('error');
      return;
    }

    // 1) Exact match on users.qr_code
    const byExact = users.find(u => u.qr_code === barcode);
    if (byExact) {
      setSelectedUser(byExact);
      setMessage(`User ${byExact.name} selected successfully!`);
      setMessageType('success');
      setScanMode('action');
      return;
    }

    // 2) Try parse as JSON/base64 JSON (legacy encoded QR)
    const decodedObj = decodeBarcodeData(barcode);
    if (decodedObj) {
      const possibleId = decodedObj.user_id || decodedObj.userId || decodedObj.id || decodedObj.code;
      if (possibleId) {
        const byId = users.find(u => u.id === possibleId || u.user_id === possibleId || u.qr_code === possibleId);
        if (byId) {
          setSelectedUser(byId);
          setMessage(`User ${byId.name} selected successfully!`);
          setMessageType('success');
          setScanMode('action');
          return;
        }
      }
    }

    // 3) Try base64 -> plain text match
    const atobText = tryAtob(barcode);
    if (atobText) {
      const byAtobExact = users.find(u => u.qr_code === atobText || u.user_id === atobText || u.id === atobText);
      if (byAtobExact) {
        setSelectedUser(byAtobExact);
        setMessage(`User ${byAtobExact.name} selected successfully!`);
        setMessageType('success');
        setScanMode('action');
        return;
      }
    }

    // 4) Try KMS pattern match (e.g., KMS-XXXX) inside scanned text
    const kmsMatch = (barcode.match(/KMS[-\w]+/i) || (atobText && atobText.match(/KMS[-\w]+/i)));
    if (kmsMatch && kmsMatch[0]) {
      const code = kmsMatch[0];
      const byKms = users.find(u => (u.qr_code && u.qr_code.includes(code)) || u.user_id === code || u.id === code);
      if (byKms) {
        setSelectedUser(byKms);
        setMessage(`User ${byKms.name} selected successfully!`);
        setMessageType('success');
        setScanMode('action');
        return;
      }
    }

    // 5) Match against user_id field
    const byUserId = users.find(u => u.user_id === barcode || u.user_id === atobText);
    if (byUserId) {
      setSelectedUser(byUserId);
      setMessage(`User ${byUserId.name} selected successfully!`);
      setMessageType('success');
      setScanMode('action');
      return;
    }

    // 6) Not found: fallback to manual entry
    setMessage('User not found for scanned code. Try manual lookup or re-scan.');
    setMessageType('error');
  };

  const handleManualLookup = () => {
    const input = manualInput.trim();
    if (!input) {
      setMessage('Please enter a code or user ID.');
      setMessageType('error');
      return;
    }
    handleScanResult(input);
  };

  const handleQuickIssue = async (keyId: string) => {
    if (!selectedUser) return;

    // Set due date to 24 hours from now
    const dueDate = new Date();
    dueDate.setHours(dueDate.getHours() + 24);

    const { error } = await createIssueRecord({
      user_id: selectedUser.id,
      key_id: keyId,
      issued_at: new Date().toISOString(),
      due_at: dueDate.toISOString(),
    });

    if (error) {
      setMessage('Failed to issue key. Please try again.');
      setMessageType('error');
    } else {
      setMessage('Key issued successfully!');
      setMessageType('success');
      // Reset after 2 seconds
      setTimeout(() => {
        setSelectedUser(null);
        setScanMode('user');
        setMessage('');
      }, 2000);
    }
  };

  const handleQuickReturn = async (recordId: string) => {
    const { error } = await returnKey(recordId, 'Returned via mobile scanner');

    if (error) {
      setMessage('Failed to return key. Please try again.');
      setMessageType('error');
    } else {
      setMessage('Key returned successfully!');
      setMessageType('success');
      // Reset after 2 seconds
      setTimeout(() => {
        setSelectedUser(null);
        setScanMode('user');
        setMessage('');
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Smartphone className="h-6 w-6 text-indigo-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Mobile Key Scanner</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${scanMode === 'user' ? 'text-indigo-600' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                scanMode === 'user' ? 'bg-indigo-100' : 'bg-green-100'
              }`}>
                {scanMode === 'user' ? <QrCode className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
              </div>
              <span className="ml-2 text-sm font-medium">Scan User</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center ${scanMode === 'action' ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                scanMode === 'action' ? 'bg-indigo-100' : 'bg-gray-100'
              }`}>
                <Key className="h-4 w-4" />
              </div>
              <span className="ml-2 text-sm font-medium">Key Action</span>
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`p-4 rounded-lg ${
              messageType === 'success' ? 'bg-green-50 border border-green-200' :
              messageType === 'error' ? 'bg-red-50 border border-red-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              <p className={`text-sm ${
                messageType === 'success' ? 'text-green-700' :
                messageType === 'error' ? 'text-red-700' :
                'text-blue-700'
              }`}>
                {message}
              </p>
            </div>
          )}

          {/* User Selection Phase */}
          {scanMode === 'user' && (
            <div className="text-center">
              <div className="mb-6">
                <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Scan User Barcode</h4>
                <p className="text-sm text-gray-600">
                  Position the user's barcode within the scanning area or enter code manually
                </p>
              </div>

              {!scanning ? (
                <button
                  onClick={startScanning}
                  className="w-full flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
                >
                  <QrCode className="h-5 w-5 mr-2" />
                  Start Scanning
                </button>
              ) : (
                <div>
                  <div id="mobile-scanner" className="w-full mb-4"></div>
                  <button
                    onClick={() => {
                      setScanning(false);
                      const scannerElement = document.getElementById('mobile-scanner');
                      if (scannerElement) {
                        scannerElement.innerHTML = '';
                      }
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
                  >
                    Cancel Scan
                  </button>
                </div>
              )}

              {/* Manual entry fallback */}
              <div className="mt-4">
                <div className="flex gap-2">
                  <input
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Enter user code or ID"
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                  <button
                    onClick={handleManualLookup}
                    className="px-4 py-2 bg-gray-100 border rounded-lg"
                  >
                    Lookup
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">If scanning fails, try manual lookup.</p>
              </div>
            </div>
          )}

          {/* Action Selection Phase */}
          {scanMode === 'action' && selectedUser && (
            <div>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-2">
                  <User className="h-5 w-5 text-gray-600 mr-2" />
                  <span className="font-medium text-gray-900">{selectedUser.name}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Type: {selectedUser.role}</p>
                  <p>ID: {selectedUser.user_id}</p>
                </div>
              </div>

              {/* Quick Issue Keys */}
              {availableKeys.length > 0 && (
                <div className="mb-6">
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Key className="h-4 w-4 mr-2" />
                    Quick Issue (24h)
                  </h5>
                  <div className="space-y-2">
                    {availableKeys.slice(0, 3).map((key) => (
                      <button
                        key={key.id}
                        onClick={() => handleQuickIssue(key.id)}
                        className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200"
                      >
                        <div className="text-left">
                          <div className="font-medium text-gray-900">{key.label}</div>
                          <div className="text-sm text-gray-500">{key.location}</div>
                        </div>
                        <Clock className="h-4 w-4 text-gray-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Return Keys */}
              {userActiveKeys.length > 0 && (
                <div className="mb-6">
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Quick Return
                  </h5>
                  <div className="space-y-2">
                    {userActiveKeys.map((record) => (
                      <button
                        key={record.id}
                        onClick={() => handleQuickReturn(record.id)}
                        className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200"
                      >
                        <div className="text-left">
                          <div className="font-medium text-gray-900">{record.keys?.label}</div>
                          <div className="text-sm text-gray-500">{record.keys?.location}</div>
                          <div className={`text-xs ${
                            record.status === 'overdue' ? 'text-red-600' : 'text-blue-600'
                          }`}>
                            Due: {new Date(record.due_at).toLocaleDateString()}
                          </div>
                        </div>
                        {record.status === 'overdue' ? (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setScanMode('user');
                    setMessage('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
                >
                  Scan Another User
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}