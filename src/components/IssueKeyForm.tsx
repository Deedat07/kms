import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useIssueRecords } from '../hooks/useIssueRecords';
import { useUsers } from '../hooks/useUsers';
import { useKeys } from '../hooks/useKeys';
import { BarcodeScanner } from './BarcodeScanner';
import { X, Loader2, Key, User, Calendar, QrCode, Clock } from 'lucide-react';

const schema = yup.object({
  userId: yup.string().required('User is required'),
  keyId: yup.string().required('Key is required'),
  returnType: yup.string().oneOf(['date', 'timer']).required('Return type is required'),
  dueDate: yup.string().when('returnType', {
    is: 'date',
    then: (schema) => schema.required('Due date is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  timerHours: yup.number().when('returnType', {
    is: 'timer',
    then: (schema) => schema.min(1, 'Minimum 1 hour').max(168, 'Maximum 168 hours (7 days)').required('Hours required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  timerMinutes: yup.number().when('returnType', {
    is: 'timer',
    then: (schema) => schema.min(0, 'Minimum 0 minutes').max(59, 'Maximum 59 minutes').required('Minutes required'),
    otherwise: (schema) => schema.notRequired(),
  }),
});

type FormData = yup.InferType<typeof schema>;

interface IssueKeyFormProps {
  onClose: () => void;
  onRefresh?: () => void;
}

export function IssueKeyForm({ onClose, onRefresh }: IssueKeyFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [returnType, setReturnType] = useState<'date' | 'timer'>('date');
  const { createIssueRecord } = useIssueRecords();
  const { users } = useUsers();
  const { keys } = useKeys();

  const availableKeys = keys.filter(key => key.status === 'available');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      returnType: 'date',
      timerHours: 24,
      timerMinutes: 0,
    },
  });

  const watchReturnType = watch('returnType');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);

    let dueDateTime: string;
    
    if (data.returnType === 'timer') {
      const now = new Date();
      const dueDate = new Date(now.getTime() + (data.timerHours! * 60 * 60 * 1000) + (data.timerMinutes! * 60 * 1000));
      dueDateTime = dueDate.toISOString();
    } else {
      dueDateTime = new Date(data.dueDate!).toISOString();
    }

    const { error: createError } = await createIssueRecord({
      user_id: data.userId,
      key_id: data.keyId,
      issued_at: new Date().toISOString(),
      due_at: dueDateTime,
    });

    if (createError) {
      setError('Failed to issue key. Please try again.');
    } else {
      // Refresh the parent component's data
      if (onRefresh) {
        onRefresh();
      }
      onClose();
    }

    setLoading(false);
  };

  // Set default due date to 7 days from now
  const getDefaultDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    setReturnType(watchReturnType || 'date');
  }, [watchReturnType]);

  const handleBarcodeScanned = (barcode: string) => {
    // Find user by barcode
    const user = users.find(u => u.qr_code === barcode);
    if (user) {
      setSelectedUser(user);
      // Set the user in the form
      setValue('userId', user.id);
      setShowScanner(false);
      setError(null);
    } else {
      setError('User not found with this barcode. Please try again or select manually.');
      setShowScanner(false);
    }
  };

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Issue Key</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-1" />
              Select User
            </label>
            <div className="flex space-x-2 mb-2">
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="flex items-center px-3 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition duration-200"
              >
                <QrCode className="h-4 w-4 mr-1" />
                Scan Barcode
              </button>
              {selectedUser && (
                <div className="flex items-center px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg">
                  ✓ {selectedUser.name} selected
                </div>
              )}
            </div>
            <select
              {...register('userId')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
            >
              <option value="">Choose a user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role}) - {user.user_id}
                </option>
              ))}
            </select>
            {errors.userId && (
              <p className="mt-1 text-sm text-red-600">{errors.userId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Key className="h-4 w-4 inline mr-1" />
              Select Key
            </label>
            <select
              {...register('keyId')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
            >
              <option value="">Choose a key</option>
              {availableKeys.map((key) => (
                <option key={key.id} value={key.id}>
                  {key.label} - {key.location}
                </option>
              ))}
            </select>
            {errors.keyId && (
              <p className="mt-1 text-sm text-red-600">{errors.keyId.message}</p>
            )}
            {availableKeys.length === 0 && (
              <p className="mt-1 text-sm text-amber-600">No keys are currently available</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Return Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  {...register('returnType')}
                  type="radio"
                  value="date"
                  className="mr-2"
                />
                <Calendar className="h-4 w-4 mr-1" />
                <span className="text-sm">Set Date</span>
              </label>
              <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  {...register('returnType')}
                  type="radio"
                  value="timer"
                  className="mr-2"
                />
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-sm">Set Timer</span>
              </label>
            </div>
          </div>

          {returnType === 'date' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Due Date
              </label>
              <input
                {...register('dueDate')}
                type="date"
                defaultValue={getDefaultDueDate()}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
              />
              {errors.dueDate && (
                <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                Return Timer
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Hours</label>
                  <input
                    {...register('timerHours', { valueAsNumber: true })}
                    type="number"
                    min="1"
                    max="168"
                    defaultValue={24}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                  />
                  {errors.timerHours && (
                    <p className="mt-1 text-xs text-red-600">{errors.timerHours.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Minutes</label>
                  <input
                    {...register('timerMinutes', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    max="59"
                    defaultValue={0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                  />
                  {errors.timerMinutes && (
                    <p className="mt-1 text-xs text-red-600">{errors.timerMinutes.message}</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Key will be due in {watch('timerHours') || 24} hours and {watch('timerMinutes') || 0} minutes
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || availableKeys.length === 0}
              className="flex-1 flex justify-center items-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Issuing...
                </>
              ) : (
                'Issue Key'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>

    {showScanner && (
      <BarcodeScanner
        onScan={handleBarcodeScanned}
        onClose={() => setShowScanner(false)}
        title="Scan User Barcode to Issue Key"
      />
    )}
    </>
  );
}