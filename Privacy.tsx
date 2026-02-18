import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const Privacy = () => {
  useEffect(() => {
    document.title = "Privacy Policy - BK Academy";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 font-sans">
      <div className="bg-white p-8 md:p-12 rounded-2xl shadow-lg border border-gray-100">
        <div className="border-b pb-8 mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Privacy Policy</h1>
            <p className="text-gray-500">Effective Date: October 24, 2024</p>
        </div>

        <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">1. Information We Collect</h2>
                <p className="mb-2">We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include:</p>
                <ul className="list-disc pl-5 space-y-1 bg-gray-50 p-4 rounded-lg">
                    <li>Name, email, phone number</li>
                    <li>Payment information (processed securely by third parties)</li>
                    <li>Profile picture and bio</li>
                    <li>Course progress and exam results</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">2. How We Use Your Information</h2>
                <p>We use the information we collect to provide, maintain, and improve our services, such as to:</p>
                <ul className="list-disc pl-5 mt-2">
                    <li>Process payments and send receipts.</li>
                    <li>Provide customer support and respond to your requests.</li>
                    <li>Send you technical notices, updates, security alerts, and administrative messages.</li>
                    <li>Monitor and analyze trends, usage, and activities in connection with our Services.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">3. Cookies and Tracking Technologies</h2>
                <p>We use cookies and similar tracking technologies to track the activity on our Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">4. Data Security</h2>
                <p>The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.</p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">5. Your Data Rights (GDPR)</h2>
                <p>You have the right to access, update, or delete the information we have on you. Whenever made possible, you can access, update or request deletion of your Personal Data directly within your account settings section. If you are unable to perform these actions yourself, please contact us to assist you.</p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">6. Contact Us</h2>
                <p>If you have any questions about this Privacy Policy, please contact us:</p>
                <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg inline-block">
                    <p><strong>Email:</strong> privacy@bkacademy.com</p>
                    <p><strong>Page:</strong> <Link to="/contact" className="text-blue-600 hover:underline">Contact Us</Link></p>
                </div>
            </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;