import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { Rocket, ArrowRight, ArrowLeft, CheckCircle, Upload, Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import FadeIn from '../components/FadeIn';
import { useTokenFactory } from '../hooks/useTokenFactory';

export default function CreateTokenPage() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { createToken, isCreating } = useTokenFactory();
  
  const [step, setStep] = useState(1);
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
      const tx = await createToken(formData);
      navigate(`/payment-status?tx=${tx}`);
    } catch (error) {
      console.error('Failed to create token:', error);
      alert('Failed to create token. Please try again.');
    }
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
            <Rocket className="text-yellow-400 mx-auto mb-4" size={64} />
            <h2 className="text-3xl font-bold mb-2">Connect Wallet</h2>
            <p className="text-gray-400">
              Please connect your wallet to create a token
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
                <label className="block text-sm font-semibold mb-2">Token Image URL</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => handleChange('imageUrl', e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:border-yellow-400 focus:outline-none transition-colors"
                  />
                  <button className="px-6 py-3 border border-gray-800 hover:border-gray-700 hover:scale-105 rounded-lg flex items-center justify-center gap-2 whitespace-nowrap transition-all">
                    <Upload size={18} />
                    <span className="hidden sm:inline">Upload</span>
                  </button>
                </div>
                <p className="text-gray-500 text-sm mt-1">PNG, JPG or GIF (recommended 512x512px)</p>
              </div>

              {formData.imageUrl && (
                <div className="border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
                  <p className="text-sm font-semibold mb-2">Preview:</p>
                  <img 
                    src={formData.imageUrl} 
                    alt="Token preview" 
                    className="w-24 h-24 rounded-full object-cover border-2 border-yellow-400 hover:scale-110 transition-transform"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                </div>
              )}
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
                    <span className="font-semibold text-yellow-400">~0.001 ETH</span>
                  </div>
                </div>
              </div>
            </div>
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
