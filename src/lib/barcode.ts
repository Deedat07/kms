import JsBarcode from 'jsbarcode';

export const generateUniqueBarcode = (userData?: {
  name: string;
  role: string;
  user_id: string;
  email: string;
  phone: string;
}): string => {
  // Generate a unique barcode with timestamp and random components
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const baseCode = `KMS${timestamp.slice(-6)}${random}`;
  
  // If user data is provided, encode it in the barcode
  if (userData) {
    const encodedData = btoa(JSON.stringify({
      code: baseCode,
      name: userData.name,
      role: userData.role,
      user_id: userData.user_id,
      email: userData.email,
      phone: userData.phone,
      generated_at: new Date().toISOString()
    }));
    return encodedData;
  }
  
  return baseCode;
};

export const decodeBarcodeData = (barcode: string): {
  code: string;
  name: string;
  role: string;
  user_id: string;
  email: string;
  phone: string;
  generated_at: string;
} | null => {
  try {
    // Try to decode as base64 encoded JSON
    const decoded = JSON.parse(atob(barcode));
    if (decoded.code && decoded.name && decoded.role) {
      return decoded;
    }
  } catch (error) {
    // If decoding fails, it might be an old format barcode
    console.log('Legacy barcode format detected:', barcode);
  }
  return null;
};

export const generateBarcodeImage = (barcodeValue: string): string => {
  try {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    
    // Generate barcode on canvas
    JsBarcode(canvas, barcodeValue, {
      format: 'CODE128',
      width: 2,
      height: 100,
      displayValue: true,
      fontSize: 16,
      textMargin: 10,
      background: '#ffffff',
      lineColor: '#000000'
    });
    
    // Convert canvas to data URL
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating barcode image:', error);
    throw new Error('Failed to generate barcode image');
  }
};

export const sendBarcodeEmail = async (
  email: string,
  userName: string,
  userType: string,
  barcode: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Generate barcode image
    const barcodeImageUrl = generateBarcodeImage(barcode);
    
    // Call Supabase Edge Function to send email
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-user-barcode`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        userName,
        userType,
        barcode,
        barcodeImageUrl
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    const result = await response.json();
    return { success: true };
  } catch (error) {
    console.error('Error sending barcode email:', error);
    return { success: false, error: (error as Error).message };
  }
};