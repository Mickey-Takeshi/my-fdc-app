'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

export function ContactSection() {
  const [formData, setFormData] = useState({
    companyName: '',
    name: '',
    email: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus('success');
        setFormData({ companyName: '', name: '', email: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '16px',
    boxSizing: 'border-box' as const,
  };

  return (
    <section id="contact" aria-labelledby="contact-heading" style={{ padding: '100px 24px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2
          id="contact-heading"
          style={{ textAlign: 'center', fontSize: '36px', fontWeight: 700, marginBottom: '16px' }}
        >
          お問い合わせ
        </h2>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '40px' }}>
          ご質問やご要望がございましたらお気軽にお問い合わせください
        </p>

        {status === 'success' ? (
          <div
            role="status"
            aria-live="polite"
            style={{
              background: '#dcfce7',
              color: '#166534',
              padding: '24px',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            お問い合わせありがとうございます。担当者より折り返しご連絡いたします。
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            <div>
              <label htmlFor="contact-company" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                会社名
              </label>
              <input
                id="contact-company"
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="contact-name" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                お名前 <span aria-hidden="true" style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="contact-name"
                type="text"
                required
                aria-required="true"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="contact-email" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                メールアドレス <span aria-hidden="true" style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="contact-email"
                type="email"
                required
                aria-required="true"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="contact-message" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                お問い合わせ内容 <span aria-hidden="true" style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                id="contact-message"
                required
                aria-required="true"
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
            {status === 'error' && (
              <div role="alert" aria-live="assertive" style={{ color: '#ef4444', fontSize: '14px' }}>
                送信に失敗しました。しばらく経ってからお試しください。
              </div>
            )}
            <button
              type="submit"
              disabled={status === 'sending'}
              aria-busy={status === 'sending'}
              style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                padding: '16px 32px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 600,
                fontSize: '16px',
                cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                opacity: status === 'sending' ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Send size={20} aria-hidden="true" />
              {status === 'sending' ? '送信中...' : '送信する'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
