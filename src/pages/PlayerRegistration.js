import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { User, Mail, Phone, Calendar, CreditCard, Copy, Check } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formFields, setFormFields] = useState([]);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState({
    fee: 50,
    upiId: 'boism-7829399506@boi',
    phoneNumber: '7829399506',
    merchantName: 'Khajjidoni Premier League'
  });
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' or 'manual'
  const [copied, setCopied] = useState(false);

  const generateUserId = () => `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const navigate = useNavigate();
  
  // Fetch form fields on component mount
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
      console.log('✅ Form fields loaded:', fieldsData.length, 'fields');
    } catch (error) {
      console.error('❌ Error fetching form fields:', error);
    }
  };

  const fetchPaymentConfig = async () => {
    try {
      const paymentSnapshot = await getDocs(collection(db, 'settings'));
      const paymentSetting = paymentSnapshot.docs.find(doc => doc.id === 'paymentConfig');
      if (paymentSetting?.data()) {
        setPaymentConfig(prev => ({
          ...prev,
          ...paymentSetting.data()
        }));
        console.log('✅ Payment config loaded:', paymentSetting.data());
      } else {
        console.log('⚠️ Payment config not found in settings, using defaults');
      }
    } catch (error) {
      console.error('❌ Error fetching payment config:', error);
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

  const handlePayment = () => {
    try {
      // Generate unique transaction ID
      const txnId = `KPL${Date.now()}`;
      
      // Use business UPI ID with proper format
      const upiUrl = `upi://pay?pa=${paymentConfig.upiId}&pn=${encodeURIComponent(paymentConfig.merchantName)}&am=${paymentConfig.fee}&tn=Registration&tr=${txnId}`;
      
      console.log('Opening UPI payment with URL:', upiUrl);
      
      // Open UPI app
      window.location.href = upiUrl;
      
      // Mark payment as completed after user returns
      setTimeout(() => {
        setPaymentCompleted(true);
      }, 2000);
      
    } catch (error) {
      console.error('Error initiating payment:', error);
      alert('Error opening UPI app. Please ensure you have a UPI app installed.');
    }
  };

  const handleCopyPhoneNumber = () => {
    navigator.clipboard.writeText(paymentConfig.phoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      // Validate photo is uploaded
      if (!photo) {
        setError('Player photo is required. Please upload your photo.');
        setLoading(false);
        return;
      }

      // Validate all required fields are filled
      const missingFields = [];
      formFields.forEach(field => {
        if (field.required && !formData[field.name]) {
          missingFields.push(field.label);
        }
      });
      
      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        setLoading(false);
        return;
      }

      // Validate phone number is exactly 10 digits
      if (formData.phone && formData.phone.length !== 10) {
        setError('Mobile number must be exactly 10 digits.');
        setLoading(false);
        return;
      }

      // Validate emergency phone if present
      if (formData.emergencyPhone && formData.emergencyPhone.length !== 10) {
        setError('Emergency contact mobile number must be exactly 10 digits.');
        setLoading(false);
        return;
      }

      // Check for duplicate phone number
      const isDuplicate = await checkDuplicatePhone(formData.phone);
      if (isDuplicate) {
        setError('A player with this mobile number is already registered.');
        setLoading(false);
        return;
      }

      // Validate payment completion
      if (!paymentCompleted) {
        setError(`Please complete the payment of ₹${paymentConfig.fee} before submitting.`);
        setLoading(false);
        return;
      }

      let photoBase64 = '';
      
      const userId = generateUserId();
      
      // Convert photo to base64
      if (photo) {
        photoBase64 = await convertToBase64(photo);
      }

      // Check for existing player stats by mobile number
      let existingStats = null;
      try {
        const statsQuery = query(
          collection(db, 'playerStats'),
          where('phone', '==', formData.phone)
        );
        const statsSnapshot = await getDocs(statsQuery);
        if (!statsSnapshot.empty) {
          existingStats = statsSnapshot.docs[0].data();
          console.log('Found existing stats for phone:', formData.phone, existingStats);
        }
      } catch (error) {
        console.log('No existing stats found for phone:', formData.phone);
      }

      // Create payload with all form data
      const payload = {
        ...formData,
        photoBase64,
        registrationFee: paymentConfig.fee,
        paymentStatus: 'completed',
        paymentCompleted: true,
        userId,
        userEmail: formData.email || formData.fullName || 'unknown', // Fallback if email not in form
        status: 'pending',
        createdAt: new Date(),
        approved: false,
        hasExistingStats: !!existingStats,
        linkedStatsName: existingStats?.name || null
      };
      
      // Remove any undefined values from payload
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });
      
      console.log('Registration payload:', payload); // Debug log
      
      await addDoc(collection(db, 'playerRegistrations'), payload);

      setSuccess(true);
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      console.error('❌ Registration submission error:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Full error:', error);
      setError(`Failed to submit registration: ${error.message || 'Unknown error'}`);
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
              {/* Static Photo Field - Always Required */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Player Photo *
                </label>
                <input
                  type="file"
                  name="photo"
                  required
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cricket-green focus:border-cricket-green"
                />
                {photo && (
                  <p className="text-sm text-green-600 mt-1">Photo selected: {photo.name}</p>
                )}
              </div>
              
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
                  
                  // Special handling for phone fields
                  if (field.type === 'tel' || field.name === 'phone' || field.name === 'emergencyPhone') {
                    return (
                      <div className="relative">
                        <input
                          type="tel"
                          name={field.name}
                          required={field.required}
                          value={formData[field.name] || ''}
                          onChange={(e) => {
                            // Only allow digits
                            const value = e.target.value.replace(/\D/g, '');
                            // Limit to 10 digits
                            if (value.length <= 10) {
                              setFormData({
                                ...formData,
                                [field.name]: value
                              });
                            }
                          }}
                          maxLength="10"
                          inputMode="numeric"
                          className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-cricket-green focus:border-cricket-green ${
                            formData[field.name] && formData[field.name].length !== 10
                              ? 'border-red-500'
                              : 'border-gray-300'
                          }`}
                          placeholder="Enter 10-digit mobile number"
                        />
                        <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        {formData[field.name] && formData[field.name].length !== 10 && (
                          <p className="text-xs text-red-600 mt-1">Mobile number must be exactly 10 digits</p>
                        )}
                      </div>
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
                Registration Fee: ₹{paymentConfig.fee} *
              </label>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Payment Instructions:</strong><br/>
                  Choose one of the payment methods below to complete your registration fee payment.
                </p>
              </div>

              {!paymentCompleted ? (
                <div className="space-y-4">
                  {/* Option 1: UPI App Payment */}
                  <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
                    <div className="flex items-start space-x-3 mb-3">
                      <input
                        type="radio"
                        id="upi-option"
                        name="payment-method"
                        checked={paymentMethod === 'upi'}
                        onChange={() => setPaymentMethod('upi')}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label htmlFor="upi-option" className="font-semibold text-gray-900 cursor-pointer">
                          Pay via UPI App
                        </label>
                        <p className="text-sm text-gray-600 mt-1">
                          Fastest way to pay. You'll be redirected to your UPI app (Google Pay, PhonePe, Paytm, etc.)
                        </p>
                      </div>
                    </div>
                    {paymentMethod === 'upi' && (
                      <button
                        type="button"
                        onClick={handlePayment}
                        className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
                      >
                        <CreditCard size={20} />
                        <span>Pay ₹{paymentConfig.fee} via UPI</span>
                      </button>
                    )}
                  </div>

                  {/* Option 2: Manual UPI Transfer */}
                  <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start space-x-3 mb-3">
                      <input
                        type="radio"
                        id="manual-option"
                        name="payment-method"
                        checked={paymentMethod === 'manual'}
                        onChange={() => setPaymentMethod('manual')}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label htmlFor="manual-option" className="font-semibold text-gray-900 cursor-pointer">
                          Manual UPI Transfer
                        </label>
                        <p className="text-sm text-gray-600 mt-1">
                          Transfer the amount manually using your UPI app
                        </p>
                      </div>
                    </div>
                    {paymentMethod === 'manual' && (
                      <div className="space-y-3">
                        <div className="bg-white rounded-md p-3 border border-gray-200">
                          <p className="text-xs text-gray-600 mb-2">Send ₹{paymentConfig.fee} to this mobile number:</p>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-gray-900">{paymentConfig.phoneNumber}</span>
                            <button
                              type="button"
                              onClick={handleCopyPhoneNumber}
                              className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                              {copied ? (
                                <>
                                  <Check size={16} />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={16} />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPaymentCompleted(true)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
                        >
                          I've Completed the Transfer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-4 rounded-md border border-green-200">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <div>
                    <span className="font-medium">Payment Completed ✓</span>
                    <p className="text-xs text-green-600">You can now submit your registration</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !paymentCompleted}
                className="btn-primary disabled:opacity-50"
              >
                {loading ? 'Submitting...' : !paymentCompleted ? 'Complete Payment First' : 'Submit Registration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PlayerRegistration;