import React, { useState, useEffect } from 'react';
import { sendContactMessage } from './api';

const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    document.title = "Contact Us - BK Academy";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
        await sendContactMessage({ name, email, subject, message });
        setSuccess(true);
        setName(''); setEmail(''); setSubject(''); setMessage('');
    } catch (error) {
        alert("মেসেজ পাঠানো যায়নি। আবার চেষ্টা করুন।");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 font-sans">
       <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">আমাদের সাথে যোগাযোগ করুন</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">যেকোনো প্রশ্ন, মতামত বা সহযোগিতার জন্য আমাদের সাথে যোগাযোগ করতে পারেন। আমরা সর্বদা আপনার পাশে আছি।</p>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-2xl shadow-xl overflow-hidden">
          
          {/* Contact Info Side */}
          <div className="bg-gradient-to-br from-blue-700 to-indigo-800 p-10 text-white flex flex-col justify-between">
             <div>
                <h3 className="text-2xl font-bold mb-6">যোগাযোগের তথ্য</h3>
                <div className="space-y-6">
                   <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                         <i className="fas fa-map-marker-alt"></i>
                      </div>
                      <div>
                         <p className="font-bold text-lg">অফিস ঠিকানা</p>
                         <p className="opacity-80">লেভেল-৪, মিরপুর ডিওএইচএস,<br/>ঢাকা-১২১৬, বাংলাদেশ</p>
                      </div>
                   </div>
                   
                   <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                         <i className="fas fa-phone-alt"></i>
                      </div>
                      <div>
                         <p className="font-bold text-lg">ফোন নাম্বার</p>
                         <p className="opacity-80">+৮৮০ ১৭১১-২২৩৩৪৪</p>
                         <p className="opacity-60 text-xs mt-1">সকাল ১০টা - রাত ৮টা (শুক্র বন্ধ)</p>
                      </div>
                   </div>

                   <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                         <i className="fas fa-envelope"></i>
                      </div>
                      <div>
                         <p className="font-bold text-lg">ইমেইল</p>
                         <p className="opacity-80">support@bkacademy.com</p>
                         <p className="opacity-80">info@bkacademy.com</p>
                      </div>
                   </div>
                </div>
             </div>

             <div className="mt-10">
                <p className="mb-4 font-bold">সোশ্যাল মিডিয়া</p>
                <div className="flex space-x-4">
                   <a href="#" className="w-10 h-10 rounded-full bg-white bg-opacity-10 hover:bg-opacity-20 flex items-center justify-center transition"><i className="fab fa-facebook-f"></i></a>
                   <a href="#" className="w-10 h-10 rounded-full bg-white bg-opacity-10 hover:bg-opacity-20 flex items-center justify-center transition"><i className="fab fa-youtube"></i></a>
                   <a href="#" className="w-10 h-10 rounded-full bg-white bg-opacity-10 hover:bg-opacity-20 flex items-center justify-center transition"><i className="fab fa-linkedin-in"></i></a>
                </div>
             </div>
          </div>

          {/* Form Side */}
          <div className="p-10">
             {success ? (
                 <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mb-6 animate-bounce">
                       <i className="fas fa-check"></i>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">ধন্যবাদ!</h3>
                    <p className="text-gray-500 mb-6">আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে। আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।</p>
                    <button onClick={() => setSuccess(false)} className="text-blue-600 font-bold hover:underline">আরেকটি মেসেজ পাঠান</button>
                 </div>
             ) : (
                 <form onSubmit={handleSubmit} className="space-y-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6">মেসেজ পাঠান</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">আপনার নাম</label>
                          <input 
                            type="text" 
                            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50" 
                            placeholder="জন ডো"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                          />
                       </div>
                       <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">ইমেইল</label>
                          <input 
                            type="email" 
                            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50" 
                            placeholder="example@mail.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                          />
                       </div>
                    </div>

                    <div>
                       <label className="block text-sm font-bold text-gray-700 mb-1">বিষয়</label>
                       <input 
                         type="text" 
                         className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50" 
                         placeholder="কোর্স সংক্রান্ত তথ্য"
                         value={subject}
                         onChange={e => setSubject(e.target.value)}
                         required
                       />
                    </div>

                    <div>
                       <label className="block text-sm font-bold text-gray-700 mb-1">মেসেজ</label>
                       <textarea 
                         className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 h-32" 
                         placeholder="বিস্তারিত লিখুন..."
                         value={message}
                         onChange={e => setMessage(e.target.value)}
                         required
                       ></textarea>
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-lg transition transform hover:-translate-y-0.5"
                    >
                       {loading ? <i className="fas fa-spinner fa-spin"></i> : 'পাঠিয়ে দিন'}
                    </button>
                 </form>
             )}
          </div>

       </div>
       
       {/* Map Embed (Optional) */}
       <div className="mt-12 rounded-2xl overflow-hidden shadow-lg h-80 border border-gray-200">
         <iframe 
           src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3650.5823360349384!2d90.36697967606771!3d23.79787578695029!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c0cd9e8c4e53%3A0x6762394e1d1f05a9!2sMirpur%20DOHS%2C%20Dhaka!5e0!3m2!1sen!2sbd!4v1714234567890!5m2!1sen!2sbd" 
           width="100%" 
           height="100%" 
           style={{ border: 0 }} 
           allowFullScreen={true} 
           loading="lazy" 
           referrerPolicy="no-referrer-when-downgrade"
         ></iframe>
       </div>
    </div>
  );
};

export default Contact;