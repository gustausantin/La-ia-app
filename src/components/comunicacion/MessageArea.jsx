// MessageArea.jsx - Área de mensajes separada del componente principal
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Phone, 
  Video,
  MoreVertical,
  Bot,
  User,
  Check,
  CheckCheck,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const MessageArea = ({ 
  conversation, 
  messages = [],
  newMessage,
  onNewMessageChange,
  onSendMessage,
  isLoading = false 
}) => {
  const messagesEndRef = useRef(null);

  // Auto scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getMessageIcon = (message) => {
    if (message.ai_generated) {
      return <Bot className="w-4 h-4 text-purple-500" />;
    }
    return <User className="w-4 h-4 text-blue-500" />;
  };

  const getMessageStatus = (message) => {
    if (message.direction === 'outgoing') {
      switch (message.status) {
        case 'sent':
          return <Check className="w-3 h-3 text-gray-400" />;
        case 'delivered':
          return <CheckCheck className="w-3 h-3 text-gray-400" />;
        case 'read':
          return <CheckCheck className="w-3 h-3 text-blue-500" />;
        default:
          return <Clock className="w-3 h-3 text-gray-400" />;
      }
    }
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim() && !isLoading) {
      onSendMessage(newMessage.trim());
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Selecciona una conversación
          </h3>
          <p className="text-gray-500">
            Elige una conversación de la lista para comenzar a chatear
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header de la conversación */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                {conversation.customer_name || 'Cliente sin nombre'}
              </h2>
              <p className="text-sm text-gray-500 capitalize">
                {conversation.channel} • {conversation.status}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <Video className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <Bot className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No hay mensajes en esta conversación</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message.id || index}
              className={`flex ${message.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.direction === 'outgoing'
                  ? 'bg-blue-500 text-white'
                  : message.ai_generated
                  ? 'bg-purple-100 text-purple-900 border border-purple-200'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <div className="flex items-start space-x-2">
                  {message.direction === 'incoming' && getMessageIcon(message)}
                  <div className="flex-1">
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-xs ${
                        message.direction === 'outgoing' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.created_at ? 
                          format(new Date(message.created_at), 'HH:mm', { locale: es }) : 
                          '--:--'
                        }
                      </span>
                      {getMessageStatus(message)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de mensaje */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => onNewMessageChange(e.target.value)}
              placeholder="Escribe un mensaje..."
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            />
          </div>
          
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <Smile className="w-5 h-5" />
          </button>
          
          <button
            type="submit"
            disabled={!newMessage.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Enviar</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default MessageArea;
