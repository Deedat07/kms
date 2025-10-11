import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useKeys } from '../hooks/useKeys';
import { X, Loader2, Key, MapPin } from 'lucide-react';

const schema = yup.object({
  label: yup.string().required('Key label is required'),
  location: yup.string().required('Location is required'),
});

type FormData = yup.InferType<typeof schema>;

interface KeyEditFormProps {
  keyData: any;
  onClose: () => void;
}

export function KeyEditForm({ keyData, onClose }: KeyEditFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updateKey, fetchKeys } = useKeys();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      label: keyData.label,
      location: keyData.location,
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);

    const { data: updatedKey, error: updateError } = await updateKey(keyData.id, {
      label: data.label,
      location: data.location,
    });

    if (updateError) {
      setError('Failed to update key. Please try again.');
      setLoading(false);
    } else {
      // Key has been updated optimistically in useKeys hook
      // Close the modal immediately
      onClose();
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Edit Key</h3>
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
              <Key className="h-4 w-4 inline mr-1" />
              Key Label
            </label>
            <input
              {...register('label')}
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
              placeholder="e.g., Room 101, Lab A, Office Key"
            />
            {errors.label && (
              <p className="mt-1 text-sm text-red-600">{errors.label.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="h-4 w-4 inline mr-1" />
              Location
            </label>
            <input
              {...register('location')}
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
              placeholder="e.g., Building A, Floor 2, Main Office"
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
            )}
          </div>

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
              disabled={loading}
              className="flex-1 flex justify-center items-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Key'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}