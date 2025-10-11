import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { User, Mail, Phone, Calendar, MapPin, Upload, CreditCard, QrCode } from 'lucide-react';
import { db } from '../firebase/firebase';

const PlayerRegistration = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    position: '',
    preferredHand: '',
    height: '',
    weight: '',
    address: '',
    experience: '',
    previousTeams: '',
    emergencyContact: '',
    emergencyPhone: ''
  });
  const [photo, setPhoto] = useState(null);
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formFields, setFormFields] = useState([]);
  const [paymentConfig, setPaymentConfig] = useState({
    fee: 100,
    instructions: '1. Pay ₹100 registration fee via UPI/Bank Transfer\n2. Take a screenshot of the payment confirmation\n3. Upload the screenshot below',
    qrCodeBase64: '',
    showQrCode: false
  });
  const [showQrCode, setShowQrCode] = useState(false);

  const generateUserId = () => `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const navigate = useNavigate();
  
  // Fetch form fields and payment config on component mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchFormFields();
    fetchPaymentConfig();
  }, []);

  const fetchFormFields = async () => {
    try {
      const fieldsSnapshot = await getDocs(collection(db, 'formFields'));
      const fieldsData = fieldsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFormFields(fieldsData.sort((a, b) => a.order - b.order));
      
      // Initialize form data based on fields
      const initialData = {};
      fieldsData.forEach(field => {
        initialData[field.name] = '';
      });
      setFormData(initialData);
    } catch (error) {
      console.error('Error fetching form fields:', error);
    }
  };

  const fetchPaymentConfig = async () => {
    try {
      const configSnapshot = await getDocs(collection(db, 'paymentConfig'));
      if (!configSnapshot.empty) {
        const configData = configSnapshot.docs[0].data();
        setPaymentConfig(configData);
      }
    } catch (error) {
      console.error('Error fetching payment config:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      // Compress image before converting to base64
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Resize image to max 800px width/height
        const maxSize = 800;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // 70% quality
      };
      
      img.onerror = reject;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoChange = (e) => {
    if (e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handlePaymentScreenshotChange = (e) => {
    if (e.target.files[0]) {
      setPaymentScreenshot(e.target.files[0]);
    }
  };

  const checkDuplicatePhone = async (phone) => {
    const q = query(
      collection(db, 'playerRegistrations'),
      where('phone', '==', phone)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      // Check for duplicate phone number
      const isDuplicate = await checkDuplicatePhone(formData.phone);
      if (isDuplicate) {
        setError('A player with this mobile number is already registered.');
        setLoading(false);
        return;
      }

      // Validate payment screenshot
      if (!paymentScreenshot) {
        setError(`Payment screenshot is required. Registration fee: ₹${paymentConfig.fee}`);
        setLoading(false);
        return;
      }

      let photoBase64 = '';
      let paymentScreenshotBase64 = '';
      
      const userId = generateUserId();
      
      // Convert photo to base64
      if (photo) {
        photoBase64 = await convertToBase64(photo);
      }

      // Convert payment screenshot to base64
      paymentScreenshotBase64 = await convertToBase64(paymentScreenshot);

      // Create payload with all form data and files
      const payload = {
        ...formData,
        photoBase64,
        paymentScreenshotBase64,
        registrationFee: paymentConfig.fee,
        paymentStatus: 'pending_verification',
        userId,
        userEmail: formData.email,
        status: 'pending',
        season: '2', // New registrations go to Season 2
        createdAt: new Date(),
        approved: false
      };
      
      console.log('Registration payload:', payload); // Debug log
      
      await addDoc(collection(db, 'playerRegistrations'), payload);

      setSuccess(true);
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      setError('Failed to submit registration. Please try again.');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen cricket-bg flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Submitted!</h2>
          <p className="text-gray-600 mb-4">
            Your player registration has been submitted successfully. You will be notified once it's reviewed by our admin team.
          </p>
          <p className="text-sm text-gray-500">Redirecting to home page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cricket-bg cricket-pattern py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Player Registration</h1>
            <p className="text-gray-600">Join the Cricket League community</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dynamic Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formFields.map((field) => {
                const getIcon = (type) => {
                  switch (type) {
                    case 'email': return <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />;
                    case 'tel': return <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />;
                    case 'date': return <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />;
                    default: return <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />;
                  }
                };

                const renderField = () => {
                  if (field.type === 'select') {
                    const options = field.validation?.includes('options:') 
                      ? field.validation.split('options:')[1].split(',') 
                      : [];
                    return (
                      <select
                        name={field.name}
                        required={field.required}
                        value={formData[field.name] || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-green focus:border-cricket-green"
                      >
                        <option value="">Select {field.label}</option>
                        {options.map(option => (
                          <option key={option.trim()} value={option.trim()}>{option.trim()}</option>
                        ))}
                      </select>
                    );
                  }
                  
                  if (field.type === 'textarea') {
                    return (
                      <textarea
                        name={field.name}
                        required={field.required}
                        value={formData[field.name] || ''}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-green focus:border-cricket-green"
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    );
                  }
                  
                  if (field.type === 'file') {
                    return (
                      <input
                        type="file"
                        name={field.name}
                        required={field.required}
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-green focus:border-cricket-green"
                      />
                    );
                  }
                  
                  return (
                    <div className="relative">
                      <input
                        type={field.type}
                        name={field.name}
                        required={field.required}
                        value={formData[field.name] || ''}
                        onChange={handleInputChange}
                        className={`w-full ${field.type !== 'date' ? 'pl-10' : 'px-3'} pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-green focus:border-cricket-green`}
                        placeholder={field.type !== 'date' ? `Enter ${field.label.toLowerCase()}` : ''}
                      />
                      {field.type !== 'date' && getIcon(field.type)}
                    </div>
                  );
                };

                return (
                  <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label} {field.required && '*'}
                    </label>
                    {renderField()}
                  </div>
                );
              })}
            </div>

            {/* Payment Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Screenshot * (Registration Fee: ₹{paymentConfig.fee})
              </label>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
                <p className="text-sm text-yellow-800">
                  <strong>Payment Instructions:</strong><br/>
                  <pre className="whitespace-pre-wrap font-sans">{paymentConfig.instructions}</pre>
                </p>
              </div>
              
              {paymentConfig.showQrCode && paymentConfig.qrCodeBase64 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Payment QR Code:</span>
                    <button
                      type="button"
                      onClick={() => setShowQrCode(!showQrCode)}
                      className="flex items-center space-x-1 text-cricket-green hover:text-cricket-navy text-sm"
                    >
                      <QrCode size={16} />
                      <span>{showQrCode ? 'Hide QR Code' : 'Show QR Code'}</span>
                    </button>
                  </div>
                  {showQrCode && (
                    <div className="bg-white p-4 rounded-lg border text-center">
                      <img src={paymentConfig.qrCodeBase64} alt="Payment QR Code" className="w-48 h-48 mx-auto border rounded" />
                      <p className="text-xs text-gray-500 mt-2">Scan to pay ₹{paymentConfig.fee}</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={handlePaymentScreenshotChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-green focus:border-cricket-green"
                />
                <CreditCard className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Registration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PlayerRegistration;