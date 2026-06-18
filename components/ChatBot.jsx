'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

function getGreeting(role, username) {
  if (role === 'admin') {
    return '¡Hola, Administrador! Estoy aquí para ayudarte a gestionar tu catálogo de productos, revisar pedidos y comprobantes, activar campañas de cumpleaños o configurar los límites de tu probador virtual. ¿Qué deseas consultar?';
  }
  if (role === 'buyer') {
    const nameStr = username ? `, ${username}` : '';
    return `¡Hola${nameStr}! Bienvenido de nuevo a CnB. Estoy a tu disposición para ayudarte a usar el probador virtual con IA, ver tus cupones de beneficios, configurar tu dirección geolocalizada o seguir el estado de tus compras. ¿En qué te puedo ayudar?`;
  }
  return '¡Bienvenido a CnB, el shopping virtual premium! 🛍️ Aquí puedes recorrer múltiples marcas y usar nuestro probador virtual con IA. Para empezar a probarte ropa, recuerda: Crea tu cuenta → Actívala por mail → Carga tu foto en Perfil → ¡Elige tus prendas favoritas! ¿Tienes alguna pregunta?';
}

export default function ChatBot() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState('guest');
  const [suggestions, setSuggestions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Synchronize role and fetch suggested questions when session changes
  useEffect(() => {
    fetch('/api/chatbot')
      .then((r) => r.json())
      .then((data) => {
        setRole(data.role);
        setSuggestions(data.suggestions || []);
        // Start conversation with the greeting
        setMessages([
          {
            role: 'assistant',
            content: getGreeting(data.role, session?.user?.username || session?.user?.username),
          },
        ]);
      })
      .catch((err) => {
        console.error('Error fetching chatbot initial setup:', err);
      });
  }, [session, status]);

  // Scroll to bottom whenever messages or loading state change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // If user opens the chat, clear unread status and focus input
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend?.trim() || input.trim();
    if (!text) return;

    if (!textToSend) {
      setInput('');
    }

    // Append user message
    const updatedMessages = [...messages, { role: 'user', content: text }];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Map message format for Groq
      const apiMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al obtener respuesta');

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error('Chatbot request error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Lo siento, en este momento tengo problemas de conexión con mis servidores. Por favor, intenta de nuevo más tarde.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <>
      {/* ── BURBUJA FLOTANTE (BOTÓN) ── */}
      <button
        onClick={toggleChat}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1f1f1f 0%, #3a3a3a 100%)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isOpen ? 'rotate(90deg) scale(0.9)' : 'scale(1)',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.transform = 'scale(1.08)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.transform = 'scale(1)';
        }}
        aria-label="Chatbot"
      >
        {isOpen ? (
          // Icono cerrar (X)
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          // Icono chat bubble
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            {hasUnread && (
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  border: '2px solid #1f1f1f',
                }}
              />
            )}
          </div>
        )}
      </button>

      {/* ── VENTANA DE CHAT ── */}
      {isOpen && (
        <div
          className="chatbot-window"
          style={{
            position: 'fixed',
            bottom: '96px',
            right: '24px',
            width: '380px',
            height: '560px',
            maxHeight: 'calc(100vh - 120px)',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(224, 219, 212, 0.7)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 999,
            animation: 'chatbot-fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            fontFamily: 'var(--font-sans), system-ui, sans-serif',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                }}
              />
              <div>
                <div style={{ fontWeight: '600', fontSize: '0.88rem', letterSpacing: '0.04em' }}>Asistente CnB</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.75, textTransform: 'capitalize' }}>
                  Modo {role === 'buyer' ? 'Comprador' : role === 'admin' ? 'Administrador' : 'Invitado'}
                </div>
              </div>
            </div>
            <button
              onClick={toggleChat}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                opacity: 0.8,
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 12H6"></path>
              </svg>
            </button>
          </div>

          {/* Messages list */}
          <div
            style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              background: 'rgba(250, 249, 246, 0.6)',
            }}
          >
            {messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                    width: '100%',
                    animation: 'chatbot-msg-slide 0.25s ease',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '82%',
                      padding: '11px 15px',
                      borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                      background: isUser ? '#1a1a1a' : 'rgba(238, 235, 230, 0.95)',
                      color: isUser ? '#ffffff' : '#1f1f1f',
                      fontSize: '0.82rem',
                      lineHeight: '1.45',
                      boxShadow: isUser ? '0 3px 10px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.03)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}

            {/* Bouncing typing indicator */}
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
                <div
                  style={{
                    padding: '12px 18px',
                    borderRadius: '16px 16px 16px 2px',
                    background: 'rgba(238, 235, 230, 0.95)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span className="dot" style={{ width: '6px', height: '6px', background: '#888', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out both' }}></span>
                  <span className="dot" style={{ width: '6px', height: '6px', background: '#888', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out both 0.2s' }}></span>
                  <span className="dot" style={{ width: '6px', height: '6px', background: '#888', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out both 0.4s' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Pills */}
          {suggestions.length > 0 && !isLoading && (
            <div
              style={{
                padding: '10px 14px 14px',
                background: 'rgba(247, 246, 242, 0.9)',
                borderTop: '1px solid rgba(224, 219, 212, 0.5)',
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(0, 0, 0, 0.15) transparent',
              }}
              className="pills-container"
            >
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(sug)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '20px',
                    border: '1px solid #d4cecb',
                    background: '#ffffff',
                    color: '#4a4542',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#1a1a1a';
                    e.currentTarget.style.background = '#fafafa';
                    e.currentTarget.style.color = '#1a1a1a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#d4cecb';
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.color = '#4a4542';
                  }}
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Text Input area */}
          <div
            style={{
              padding: '14px 16px',
              background: '#ffffff',
              borderTop: '1px solid rgba(224, 219, 212, 0.7)',
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Escribe tu mensaje aquí..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '11px 14px',
                borderRadius: '24px',
                border: '1px solid #d4cecb',
                fontSize: '0.82rem',
                outline: 'none',
                background: '#fcfcfc',
                color: '#1a1a1a',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#1a1a1a')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#d4cecb')}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !input.trim()}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: input.trim() && !isLoading ? '#1a1a1a' : '#eae7e2',
                color: input.trim() && !isLoading ? '#ffffff' : '#aaa',
                border: 'none',
                cursor: input.trim() && !isLoading ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── ESTILOS GLOBALES INCORPORADOS (MICROANIMACIONES) ── */}
      <style jsx global>{`
        @keyframes chatbot-fade-in {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes chatbot-msg-slide {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes bounce {
          0%, 80%, 100% { 
            transform: scale(0);
          } 40% { 
            transform: scale(1.0);
          }
        }
        
        .pills-container::-webkit-scrollbar {
          height: 5px;
        }
        .pills-container::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.02);
          border-radius: 10px;
        }
        .pills-container::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.12);
          border-radius: 10px;
          transition: background 0.2s;
        }
        .pills-container::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.25);
        }

        /* Responsive styling */
        @media (max-width: 600px) {
          .chatbot-window {
            width: 100% !important;
            height: 100% !important;
            max-height: 100% !important;
            bottom: 0 !important;
            right: 0 !important;
            border-radius: 0 !important;
            z-index: 2000 !important;
          }
        }
      `}</style>
    </>
  );
}
