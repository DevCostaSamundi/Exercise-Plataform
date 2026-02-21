import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useConnect } from 'wagmi';
import { Rocket, ArrowRight, ArrowLeft, CheckCircle, Upload, Loader2, Wallet, X, Image } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import FadeIn from '../components/FadeIn';
import { useTokenFactory } from '../hooks/useTokenFactory';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export default function CreateTokenPage() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { createToken, isCreating, launchFee } = useTokenFactory();
  const fileInputRef = useRef(null);
  
  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    imageUrl: '',
    initialSupply: '1000000',
    twitter: '',
    telegram: '',
    website: ''
  });
  const [errors, setErrors] = useState({});

  const validateStep = (currentStep) => {
    const newErrors = {};
    
    if (currentStep === 1) {
      if (!formData.name.trim()) newErrors.name = 'Token name is required';
      if (!formData.symbol.trim()) newErrors.symbol = 'Symbol is required';
      if (formData.symbol.length > 10) newErrors.symbol = 'Symbol too long (max 10 chars)';
      if (!formData.description.trim()) newErrors.description = 'Description is required';
    }
    
    if (currentStep === 2) {
      if (!formData.initialSupply || parseFloat(formData.initialSupply) <= 0) {
        newErrors.initialSupply = 'Initial supply must be positive';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => setStep(step - 1);

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    
    try {
      const tx = await createToken({
        name: formData.name,
        symbol: formData.symbol,
        initialSupply: formData.initialSupply
      });
      
      // After successful on-chain creation, save token to backend database
      // The token address comes from the transaction receipt
      try {
        const walletAddress = window.ethereum?.selectedAddress || address;
        const response = await fetch(`${API_BASE}/tokens`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Wallet-Address': walletAddress,
          },
          body: JSON.stringify({
            address: tx,
            name: formData.name,
            symbol: formData.symbol,
            initialSupply: formData.initialSupply,
            description: formData.description || '',
            logo: formData.imageUrl || '',
            website: formData.website || '',
            twitter: formData.twitter || '',
            telegram: formData.telegram || '',
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Backend error:', errorData);
          throw new Error(errorData.error || 'Failed to save token to database');
        }

        const savedToken = await response.json();
        console.log('Token saved to database:', savedToken);
      } catch (dbErr) {
        console.error('Failed to save token to database (token was created on-chain):', dbErr);
        // Still navigate to portfolio even if DB save fails
      }

      navigate('/portfolio?success=true');
    } catch (error) {
      console.error('Failed to create token:', error);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    
    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setErrors({ ...errors, image: 'File too large. Maximum size is 5MB.' });
      return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrors({ ...errors, image: 'Invalid file type. Use JPEG, PNG, GIF, or WebP.' });
      return;
    }

    // Show local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);

    // Upload to backend
    setIsUploading(true);
    setErrors({ ...errors, image: null });
    
    try {
      const uploadData = new FormData();
      uploadData.append('image', file);
      
      const response = await fetch(`${API_BASE}/upload/image`, {
        method: 'POST',
        body: uploadData,
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Upload failed');
      }
      
      const result = await response.json();
      handleChange('imageUrl', result.url);
    } catch (err) {
      console.error('Image upload failed:', err);
      setErrors({ ...errors, image: err.message || 'Upload failed. Try again.' });
      setImagePreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageUpload(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    handleChange('imageUrl', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  if (!isConnected) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-h-screen bg-black text-white flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <Rocket className="text-yellow-400 mx-auto mb-6" size={64} />
            <h2 className="text-3xl font-bold mb-3">Connect Wallet</h2>
            <p className="text-gray-400 mb-8">
              Please connect your wallet to create a token
            </p>
            
            {/* Connect Buttons */}
            <div className="space-y-3">
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => connect({ connector })}
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-3 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-4 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Wallet size={20} />
                  <span>
                    {isPending ? 'Connecting...' : `Connect with ${connector.name}`}
                  </span>
                </button>
              ))}
            </div>
            
            <p className="text-xs text-gray-600 mt-6">
              By connecting, you agree to our Terms of Service
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <div className="flex-1 text-white p-4 md:p-8 pb-20 md:pb-8 overflow-x-hidden w-full md:w-auto">
        <div className="max-w-3xl mx-auto w-full">
          
          {/* Header */}
          <div className="mb-8 md:mb-12">
            <h1 className="text-3xl md:text-5xl font-black mb-3 flex items-center gap-2 md:gap-3">
              <Rocket className="text-yellow-400" size={32} />
              Launch Your Token
            </h1>
            <p className="text-gray-400 text-base md:text-lg">
              Create your memecoin in 3 simple steps
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8 md:mb-12">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 md:w-12 md:h-12 text-sm md:text-base rounded-full font-bold transition-all duration-300 ${
                  step >= s ? 'bg-yellow-400 text-black scale-110' : 'border-2 border-gray-800 text-gray-600'
                } ${step === s ? 'ring-4 ring-yellow-400/30' : ''}`}>
                  {step > s ? <CheckCircle size={20} className="md:w-6 md:h-6" /> : s}
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-1 mx-2 md:mx-4 transition-all duration-500 ${
                    step > s ? 'bg-yellow-400' : 'bg-gray-800'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <FadeIn className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Basic Information</h2>
              
              <div>
                <label className="block text-sm font-semibold mb-2">Token Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Angola Rising"
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:border-yellow-400 focus:outline-none transition-colors"
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Symbol *</label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => handleChange('symbol', e.target.value.toUpperCase())}
                  placeholder="e.g., AGR"
                  maxLength={10}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:border-yellow-400 focus:outline-none uppercase transition-colors"
                />
                {errors.symbol && <p className="text-red-400 text-sm mt-1">{errors.symbol}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Tell the community about your token..."
                  rows={4}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:border-yellow-400 focus:outline-none resize-none transition-colors"
                />
                {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
                <p className="text-gray-500 text-sm mt-1">{formData.description.length}/500</p>
              </div>
            </FadeIn>
          )}

          {/* Step 2: Supply & Image */}
          {step === 2 && (
            <FadeIn className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Token Supply & Image</h2>
              
              <div>
                <label className="block text-sm font-semibold mb-2">Initial Supply *</label>
                <input
                  type="number"
                  value={formData.initialSupply}
                  onChange={(e) => handleChange('initialSupply', e.target.value)}
                  placeholder="1000000"
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:border-yellow-400 focus:outline-none transition-colors"
                />
                {errors.initialSupply && <p className="text-red-400 text-sm mt-1">{errors.initialSupply}</p>}
                <p className="text-gray-500 text-sm mt-1">Recommended: 1,000,000 - 100,000,000</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Token Image</label>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {/* Preview or Upload Area */}
                {(imagePreview || formData.imageUrl) ? (
                  <div className="relative inline-block">
                    <img 
                      src={imagePreview || formData.imageUrl} 
                      alt="Token preview" 
                      className="w-32 h-32 rounded-2xl object-cover border-2 border-yellow-400"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                    >
                      <X size={14} />
                    </button>
                    <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                      <CheckCircle size={12} /> Image uploaded
                    </p>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-gray-700 hover:border-yellow-400/50 rounded-xl p-8 text-center cursor-pointer transition-all hover:bg-gray-900/50"
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="animate-spin text-yellow-400" size={32} />
                        <p className="text-sm text-gray-400">Uploading...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
                          <Image className="text-gray-500" size={28} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-300">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG, GIF or WebP (max 5MB, recommended 512×512px)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {errors.image && <p className="text-red-400 text-sm mt-2">{errors.image}</p>}
                
                {/* Or paste URL */}
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Or paste image URL:</p>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => {
                      handleChange('imageUrl', e.target.value);
                      setImagePreview(null);
                    }}
                    placeholder="https://..."
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-sm focus:border-yellow-400 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </FadeIn>
          )}

          {/* Step 3: Social & Review */}
          {step === 3 && (
            <FadeIn className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Social Links & Review</h2>
              
              <div>
                <label className="block text-sm font-semibold mb-2">Twitter (Optional)</label>
                <input
                  type="url"
                  value={formData.twitter}
                  onChange={(e) => handleChange('twitter', e.target.value)}
                  placeholder="https://twitter.com/..."
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:border-yellow-400 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Telegram (Optional)</label>
                <input
                  type="url"
                  value={formData.telegram}
                  onChange={(e) => handleChange('telegram', e.target.value)}
                  placeholder="https://t.me/..."
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:border-yellow-400 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Website (Optional)</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:border-yellow-400 focus:outline-none"
                />
              </div>

              {/* Review Summary */}
              <div className="border border-gray-800 rounded-lg p-6 bg-gray-900 mt-8">
                <h3 className="font-bold text-xl mb-4">Review Your Token</h3>
                
                {/* Image Preview in review */}
                {(imagePreview || formData.imageUrl) && (
                  <div className="flex justify-center mb-4">
                    <img 
                      src={imagePreview || formData.imageUrl} 
                      alt="Token" 
                      className="w-20 h-20 rounded-full object-cover border-2 border-yellow-400"
                    />
                  </div>
                )}
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name:</span>
                    <span className="font-semibold">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Symbol:</span>
                    <span className="font-semibold">{formData.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Supply:</span>
                    <span className="font-semibold">{parseInt(formData.initialSupply).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Creation Fee:</span>
                    <span className="font-semibold text-yellow-400">
                      {launchFee ? `${(parseFloat(launchFee) / 1e18).toFixed(4)} ETH` : '~0.01 ETH'}
                    </span>
                  </div>
                </div>
              </div>
            </FadeIn>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-12 pt-8 border-t border-gray-900">
            {step > 1 && (
              <button
                onClick={prevStep}
                className="px-6 py-3 border border-gray-800 hover:border-gray-700 rounded-lg font-semibold flex items-center gap-2"
                disabled={isCreating}
              >
                <ArrowLeft size={20} />
                Back
              </button>
            )}
            
            <div className="ml-auto">
              {step < 3 ? (
                <button
                  onClick={nextStep}
                  className="px-8 py-3 bg-yellow-400 hover:bg-yellow-500 hover:scale-105 active:scale-95 text-black rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-yellow-400/20 hover:shadow-yellow-400/40 transition-all"
                >
                  Next
                  <ArrowRight size={20} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isCreating}
                  className="px-8 py-3 bg-yellow-400 hover:bg-yellow-500 hover:scale-105 active:scale-95 text-black rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-yellow-400/20 hover:shadow-yellow-400/40 transition-all"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Rocket size={20} />
                      Launch Token
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
