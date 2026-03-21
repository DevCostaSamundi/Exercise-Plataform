/**
 * LiveChatInput Component
 * Input de chat para lives — com suporte a emojis, tips e slow mode
 */

import { useState, useRef, useEffect } from 'react';
import { FiSend, FiSmile, FiDollarSign } from 'react-icons/fi';

const QUICK_EMOJIS = ['❤️', '🔥', '😍', '👏', '💯', '😂', '🎉', '💎'];

const LiveChatInput = ({
  onSendMessage,
  onSendTip,
  disabled        = false,
  slowModeSeconds = 0,
  placeholder     = 'Escreve uma mensagem...',
  maxLength       = 200,
}) => {
  const [message,      setMessage]      = useState('');
  const [showEmojis,   setShowEmojis]   = useState(false);
  const [cooldown,     setCooldown]     = useState(0);
  const [submitting,   setSubmitting]   = useState(false);
  const inputRef   = useRef(null);
  const timerRef   = useRef(null);

  // Limpar timer no unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = () => {
    if (slowModeSeconds <= 0) return;
    setCooldown(slowModeSeconds);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const text = message.trim();
    if (!text || submitting || cooldown > 0 || disabled) return;

    setSubmitting(true);
    try {
      await onSendMessage?.(text);
      setMessage('');
      startCooldown();
      inputRef.current?.focus();
    } catch (err) {
      console.error('LiveChatInput send error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const insertEmoji = (emoji) => {
    if (message.length >= maxLength) return;
    setMessage((prev) => prev + emoji);
    setShowEmojis(false);
    inputRef.current?.focus();
  };

  const isBlocked = disabled || cooldown > 0 || submitting;

  return (
    <div className="relative">
      {/* Emoji Picker */}
      {showEmojis && (
        <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-3 z-10">
          <div className="flex gap-2 flex-wrap">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => insertEmoji(emoji)}
                className="text-xl hover:scale-125 transition-transform"
                type="button"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Row */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => setShowEmojis(!showEmojis)}
          disabled={isBlocked}
          className="flex-shrink-0 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors disabled:opacity-40"
          aria-label="Emojis"
        >
          <FiSmile className="text-xl" />
        </button>

        {/* Text Input */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, maxLength))}
            onKeyDown={handleKeyDown}
            placeholder={cooldown > 0 ? `Aguarda ${cooldown}s…` : placeholder}
            disabled={isBlocked}
            className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {/* Contador de caracteres */}
          {message.length > maxLength * 0.8 && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              {maxLength - message.length}
            </span>
          )}
        </div>

        {/* Tip Button (opcional) */}
        {onSendTip && (
          <button
            type="button"
            onClick={onSendTip}
            disabled={isBlocked}
            className="flex-shrink-0 p-2 text-amber-500 hover:text-amber-600 transition-colors disabled:opacity-40"
            aria-label="Enviar tip"
          >
            <FiDollarSign className="text-xl" />
          </button>
        )}

        {/* Send Button */}
        <button
          type="submit"
          disabled={!message.trim() || isBlocked}
          className="flex-shrink-0 p-2 bg-black dark:bg-white text-white dark:text-black rounded-full transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          aria-label="Enviar"
        >
          <FiSend className="text-lg" />
        </button>
      </form>

      {/* Slow mode indicator */}
      {slowModeSeconds > 0 && cooldown === 0 && (
        <p className="text-xs text-slate-400 mt-1 ml-2">
          Modo lento: {slowModeSeconds}s entre mensagens
        </p>
      )}
    </div>
  );
};

export default LiveChatInput;