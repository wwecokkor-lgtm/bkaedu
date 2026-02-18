import React, { useState, useEffect } from 'react';
import { PaymentMethod, Course, DiscountCampaign } from './types';
import { getPaymentMethods, submitPaymentRequest, uploadMediaFile, getActiveCampaigns, validateCoupon, calculateBestPrice } from './api';
import { useAuth } from './AuthContext';

interface PaymentModalProps {
  course: Course;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ course, onClose, onSuccess }) => {
  const { userProfile } = useAuth();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [activeTab, setActiveTab] = useState<'instructions' | 'form' | 'success'>('instructions');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  
  // Discount State
  const [activeCampaigns, setActiveCampaigns] = useState<DiscountCampaign[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  
  // Form State
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [trxId, setTrxId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initial Pricing Logic
  const { price: eventPrice, activeEventName } = calculateBestPrice(course, activeCampaigns);
  const finalPrice = Math.max(0, eventPrice - couponDiscount);
  const originalPrice = course.discountPrice || course.price;

  useEffect(() => {
    // Load Methods and Active Campaigns
    Promise.all([getPaymentMethods(), getActiveCampaigns()]).then(([m, c]) => {
      const enabled = m.filter(x => x.isEnabled);
      setMethods(enabled);
      if (enabled.length > 0) setSelectedMethod(enabled[0]);
      setActiveCampaigns(c);
    });
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setLoading(true);
    const result = await validateCoupon(couponCode, course.id, eventPrice); // Validate against current discounted price
    if (result.valid) {
      setCouponDiscount(result.discount);
      setCouponMessage(`Applied: -৳${result.discount}`);
    } else {
      setCouponDiscount(0);
      setCouponMessage(result.message);
    }
    setLoading(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Number copied!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!selectedMethod || !userProfile) return;
    if (!screenshot) {
      setError("Payment screenshot required.");
      return;
    }
    if (trxId.length < 5) {
      setError("Invalid Transaction ID.");
      return;
    }

    setLoading(true);
    try {
      // Upload Screenshot
      const fileData = await uploadMediaFile(screenshot, 'payments', userProfile.uid);
      if (!fileData) throw new Error("Image upload failed");

      // Submit Data
      await submitPaymentRequest({
        userId: userProfile.uid,
        userName: userProfile.displayName,
        userEmail: userProfile.email,
        userPhone: phone,
        courseId: course.id,
        courseTitle: course.title,
        amount: finalPrice,
        originalAmount: originalPrice,
        discountApplied: (originalPrice - finalPrice),
        couponCode: couponCode || activeEventName || undefined,
        paymentMethod: selectedMethod.methodName,
        transactionId: trxId,
        screenshotUrl: fileData.url
      });

      setActiveTab('success');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Payment submission failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-white rounded-2xl shadow-2xl z-10 w-full max-w-lg overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="bg-gray-50 border-b p-5 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Secure Payment</h3>
            <p className="text-xs text-gray-500 mt-1">{course.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500"><i className="fas fa-times text-xl"></i></button>
        </div>

        {/* Content */}
        <div className="p-6">
          
          {/* Price Breakdown */}
          <div className="bg-blue-50 p-4 rounded-xl mb-6 border border-blue-100">
             <div className="flex justify-between text-sm mb-1 text-gray-600">
               <span>Original Price</span>
               <span className="line-through">৳{originalPrice}</span>
             </div>
             
             {activeEventName && (
               <div className="flex justify-between text-sm mb-1 text-green-600 font-bold">
                 <span><i className="fas fa-tag mr-1"></i> {activeEventName}</span>
                 <span>- ৳{originalPrice - eventPrice}</span>
               </div>
             )}

             {couponDiscount > 0 && (
               <div className="flex justify-between text-sm mb-1 text-purple-600 font-bold">
                 <span><i className="fas fa-ticket-alt mr-1"></i> Coupon ({couponCode})</span>
                 <span>- ৳{couponDiscount}</span>
               </div>
             )}

             <div className="border-t border-blue-200 mt-2 pt-2 flex justify-between items-end">
               <span className="font-bold text-gray-800">Total Payable</span>
               <span className="text-3xl font-bold text-blue-700">৳{finalPrice}</span>
             </div>
          </div>

          {/* TAB 1: INSTRUCTIONS */}
          {activeTab === 'instructions' && (
            <div className="space-y-6">
              
              {/* Coupon Input */}
              <div className="flex space-x-2">
                 <input 
                   type="text" 
                   className="flex-grow border rounded-lg px-3 py-2 text-sm uppercase" 
                   placeholder="Have a coupon code?"
                   value={couponCode}
                   onChange={e => setCouponCode(e.target.value.toUpperCase())}
                 />
                 <button 
                   onClick={handleApplyCoupon} 
                   disabled={loading || !couponCode}
                   className="bg-gray-800 text-white px-4 rounded-lg text-xs font-bold hover:bg-gray-900 disabled:opacity-50"
                 >
                   Apply
                 </button>
              </div>
              {couponMessage && <p className={`text-xs font-bold ${couponDiscount > 0 ? 'text-green-600' : 'text-red-500'}`}>{couponMessage}</p>}

              <div className="flex justify-center space-x-4 mb-4">
                {methods.map(m => (
                  <button 
                    key={m.id}
                    onClick={() => setSelectedMethod(m)}
                    className={`px-4 py-2 rounded-lg border-2 font-bold flex items-center space-x-2 transition ${selectedMethod?.id === m.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}
                  >
                    <span className="capitalize">{m.methodName}</span>
                  </button>
                ))}
              </div>

              {selectedMethod && (
                <div className="text-center p-4 border rounded-xl bg-gray-50">
                   <p className="text-sm text-gray-600 mb-2">{selectedMethod.methodName} {selectedMethod.accountType} Number</p>
                   <div className="flex items-center justify-center space-x-3 mb-2">
                      <span className="text-2xl font-bold text-gray-800 tracking-wider">{selectedMethod.accountNumber}</span>
                      <button onClick={() => handleCopy(selectedMethod.accountNumber)} className="text-blue-600 hover:bg-blue-100 p-2 rounded-full"><i className="far fa-copy"></i></button>
                   </div>
                   <p className="text-xs text-gray-500">{selectedMethod.instructions}</p>
                </div>
              )}

              <button 
                onClick={() => setActiveTab('form')}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg flex justify-center items-center"
              >
                Proceed to Payment <i className="fas fa-arrow-right ml-2"></i>
              </button>
            </div>
          )}

          {/* TAB 2: FORM */}
          {activeTab === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Sender Mobile Number</label>
                <input 
                  type="text" 
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="017XXXXXXXX"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Transaction ID (TrxID)</label>
                <input 
                  type="text" 
                  required
                  value={trxId}
                  onChange={e => setTrxId(e.target.value)}
                  className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                  placeholder="8N7S6D..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Upload Screenshot</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 relative">
                   <input 
                     type="file" 
                     accept="image/*"
                     className="absolute inset-0 opacity-0 cursor-pointer"
                     onChange={e => setScreenshot(e.target.files ? e.target.files[0] : null)}
                   />
                   {screenshot ? (
                     <div className="text-green-600 font-bold text-sm">
                       <i className="fas fa-check-circle mr-1"></i> {screenshot.name}
                     </div>
                   ) : (
                     <div className="text-gray-500 text-sm">
                       <i className="fas fa-cloud-upload-alt text-2xl mb-1 block"></i>
                       Click to upload proof
                     </div>
                   )}
                </div>
              </div>

              {error && <p className="text-red-500 text-xs text-center font-bold bg-red-50 p-2 rounded">{error}</p>}

              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={() => setActiveTab('instructions')} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold">Back</button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 shadow-lg flex justify-center items-center"
                >
                  {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Confirm Payment'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: SUCCESS */}
          {activeTab === 'success' && (
            <div className="text-center py-8">
               <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 animate-bounce">
                 <i className="fas fa-check"></i>
               </div>
               <h3 className="text-2xl font-bold text-gray-800 mb-2">Request Submitted!</h3>
               <p className="text-gray-600 text-sm mb-8">We will verify your payment and unlock the course shortly. (Max 24 hours)</p>
               <button onClick={onSuccess || onClose} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg">Done</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PaymentModal;