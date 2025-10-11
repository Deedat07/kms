import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useUsers } from '../hooks/useUsers';
import { FileUpload } from './FileUpload';
import { uploadIdCard } from '../lib/storage';
import { generateUniqueBarcode, sendBarcodeEmail } from '../lib/barcode';
import { X, Loader2, User, Mail, Phone, Hash } from 'lucide-react';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  type: yup.string().oneOf(['student', 'lecturer', 'cleaner']).required('Type is required'),
  phone: yup.string().required('Phone number is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  idCard: yup.mixed().nullable().required('ID card upload is required'),
});

type FormData = yup.InferType<typeof schema>;

interface UserRegistrationFormProps {
  onClose: () => void;
  onRefresh: () => void;
}

export function UserRegistrationForm({ onClose, onRefresh }: UserRegistrationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const { createUser } = useUsers();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const userType = watch('type');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    setUploadError(null);

    if (!selectedFile) {
      setError('Please upload the user\'s ID card');
      setLoading(false);
      return;
    }

    // Upload ID card first
    setUploading(true);
    const { url: idCardUrl, error: uploadError } = await uploadIdCard(selectedFile, 'user-ids');
    setUploading(false);

    if (uploadError) {
      setUploadError(uploadError.message);
      setLoading(false);
      return;
    }

    // Generate unique barcode
    const barcode = generateUniqueBarcode({
      name: data.name,
      role: data.type as 'student' | 'lecturer' | 'cleaner',
      user_id: data.type === 'student' ? generateStudentId() : 
               data.type === 'lecturer' ? generateStaffId() : 
               generateCleanerId(),
      email: data.email,
      phone: data.phone
    });

    const userData = {
      name: data.name,
      role: data.type as 'student' | 'lecturer' | 'cleaner',
      user_id: data.type === 'student' ? generateStudentId() : 
               data.type === 'lecturer' ? generateStaffId() : 
               generateCleanerId(),
      phone: data.phone,
      email: data.email,
      id_card_url: idCardUrl!,
      qr_code: barcode,
    };

    const { error: createError } = await createUser(userData);

    if (createError) {
      setError('Failed to register user. Please try again.');
      console.error('User creation error:', createError);
      setLoading(false);
      return;
    }

    // Send barcode email
    setSendingEmail(true);
    const { success: emailSuccess, error: emailError } = await sendBarcodeEmail(
      data.email,
      data.name,
      data.type,
      barcode
    );

    if (!emailSuccess) {
      console.error('Failed to send barcode email:', emailError);
      // Don't fail the registration if email fails, just log it
    }

    setSendingEmail(false);
    setSuccess(true);
    
    // Refresh the user list in the parent component
    onRefresh();
    
    // Auto-close modal after 2 seconds
    setTimeout(() => {
      onClose();
    }, 2000);

    setLoading(false);
  };

  const generateStudentId = () => {
    // Generate a unique student ID with format: STU + timestamp + random
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `STU${timestamp}${random}`;
  };

  const generateStaffId = () => {
    // Generate a unique staff ID with format: STF + timestamp + random
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `STF${timestamp}${random}`;
  };

  const generateCleanerId = () => {
    // Generate a unique cleaner ID with format: CLN + timestamp + random
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `CLN${timestamp}${random}`;
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setValue('idCard', file);
    clearErrors('idCard');
    setUploadError(null);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setValue('idCard', null);
    setUploadError(null);
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
          <div className="text-center p-8">
            <div className="mx-auto h-16 w-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
            <p className="text-gray-600 mb-4">
              User has been registered successfully and their barcode has been generated.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700">
                ✓ User account created<br/>
                ✓ ID automatically generated<br/>
                ✓ QR code generated<br/>
                ✓ ID card uploaded<br/>
                {sendingEmail ? '⏳ Sending barcode email...' : '✓ Barcode email sent'}
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-4">This dialog will close automatically...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Register New User</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>


        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div>
            <FileUpload
              label="Upload User's ID Card"
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              selectedFile={selectedFile}
              uploading={uploading}
              error={uploadError}
              required
            />
            {errors.idCard && (
              <p className="mt-1 text-sm text-red-600">{errors.idCard.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-1" />
              Full Name
            </label>
            <input
              {...register('name')}
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
              placeholder="Enter full name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User Type
            </label>
            <select
              {...register('type')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
            >
              <option value="">Select user type</option>
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
              <option value="cleaner">Cleaner</option>
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="h-4 w-4 inline mr-1" />
              Phone Number
            </label>
            <input
              {...register('phone')}
              type="tel"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
              placeholder="Enter phone number"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="h-4 w-4 inline mr-1" />
              Email Address
            </label>
            <input
              {...register('email')}
              type="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
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
              disabled={loading || uploading || sendingEmail}
              className="flex-1 flex justify-center items-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {loading || uploading || sendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploading ? 'Uploading ID Card...' : 
                   sendingEmail ? 'Sending Barcode Email...' : 'Registering...'}
                </>
              ) : (
                'Register User'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}