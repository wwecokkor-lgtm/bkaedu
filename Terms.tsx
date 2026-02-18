import React, { useEffect } from 'react';

const Terms = () => {
  useEffect(() => {
    document.title = "Terms & Conditions - BK Academy";
    window.scrollTo(0, 0);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 py-8 font-sans">
      
      {/* Sidebar Navigation (Sticky) */}
      <aside className="hidden lg:block lg:col-span-1">
        <div className="sticky top-24 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 uppercase tracking-wider text-sm">Table of Contents</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            {['Introduction', 'User Accounts', 'Course Access', 'Payments & Refunds', 'Intellectual Property', 'Termination', 'Liability'].map((item) => (
               <li key={item}>
                 <button 
                   onClick={() => scrollToSection(item.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-'))}
                   className="hover:text-blue-600 hover:translate-x-1 transition-transform block text-left"
                 >
                   {item}
                 </button>
               </li>
            ))}
          </ul>
          <div className="mt-8 pt-6 border-t">
            <p className="text-xs text-gray-400">Last Updated: <br/><span className="text-gray-800 font-bold">Oct 24, 2024</span></p>
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className="lg:col-span-3 bg-white p-8 md:p-12 rounded-xl shadow-sm border border-gray-100 text-gray-700 leading-relaxed">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms & Conditions</h1>
        <p className="text-gray-500 mb-10">Please read these terms carefully before using BK Academy.</p>

        <section id="introduction" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">1. Introduction</h2>
          <p>Welcome to BK Academy. By accessing our website, courses, and services, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree with any part of these terms, you are prohibited from using our services.</p>
        </section>

        <section id="user-accounts" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">2. User Accounts</h2>
          <p className="mb-3">To access certain features of the platform, you must register for an account. You agree to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Provide accurate, current, and complete information during registration.</li>
            <li>Maintain the security of your password and identification.</li>
            <li>Accept all responsibility for any and all activities that occur under your account.</li>
          </ul>
        </section>

        <section id="course-access" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">3. Course Access & License</h2>
          <p>Upon purchase or enrollment, BK Academy grants you a limited, non-exclusive, non-transferable license to access and view the courses for which you have paid all required fees, solely for your personal, non-commercial, educational purposes.</p>
        </section>

        <section id="payments-refunds" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">4. Payments & Refunds</h2>
          <p className="mb-4"><strong>Payments:</strong> You agree to pay the fees for courses that you purchase, and you authorize us to charge your debit or credit card or process other means of payment (such as Bkash/Nagad).</p>
          <p><strong>Refunds:</strong> We offer a 7-day refund policy for most courses. If you are not satisfied, you may request a refund within 7 days of purchase, provided you have not completed more than 30% of the course.</p>
        </section>

        <section id="intellectual-property" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">5. Intellectual Property</h2>
          <p>All content included on the website, such as text, graphics, logos, images, audio clips, digital downloads, and data compilations, is the property of BK Academy or its content suppliers and protected by international copyright laws.</p>
        </section>

        <section id="termination" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">6. Termination</h2>
          <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
        </section>

        <section id="liability" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">7. Limitation of Liability</h2>
          <p>In no event shall BK Academy, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.</p>
        </section>

        <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-blue-600 mt-8">
           <p className="font-bold text-gray-800">Questions about the Terms?</p>
           <p className="text-sm mt-1">Contact us at <a href="mailto:legal@bkacademy.com" className="text-blue-600 underline">legal@bkacademy.com</a></p>
        </div>
      </div>
    </div>
  );
};

export default Terms;