// ConversationList.jsx - Lista de conversaciones separada del componente principal
import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MessageSquare, 
  Clock, 
  Phone, 
  Mail, 
  MessageCircle,
  CheckCheck,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ConversationList = ({ 
  conversations = [], 
  selectedConversation, 
  onSelectConversation,
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterChange 
}) => {
  const getChannelIcon = (channel) => {
    const icons = {
      whatsapp: MessageCircle,
      phone: Phone,
      email: Mail,
      instagram: MessageSquare,
      facebook: MessageSquare
    };
    const Icon = icons[channel] || MessageSquare;
    return <Icon className="w-4 h-4" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-gray-100 text-gray-800',
      escalated: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.pending;
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.last_message?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || conv.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="w-1/3 border-r border-gray-200 flex flex-col h-full">
      {/* Header con búsqueda y filtros */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-2 mb-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar conversaciones..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => onFilterChange(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos</option>
            <option value="active">Activas</option>
            <option value="pending">Pendientes</option>
            <option value="closed">Cerradas</option>
            <option value="escalated">Escaladas</option>
          </select>
        </div>
      </div>

      {/* Lista de conversaciones */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No hay conversaciones</p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => onSelectConversation(conversation)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedConversation?.id === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    {getChannelIcon(conversation.channel)}
                    <h3 className="font-medium text-gray-900 truncate">
                      {conversation.customer_name || 'Cliente sin nombre'}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(conversation.status)}`}>
                      {conversation.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 truncate mb-1">
                    {conversation.last_message || 'Sin mensajes'}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {conversation.updated_at ? 
                        format(new Date(conversation.updated_at), 'HH:mm', { locale: es }) : 
                        '--:--'
                      }
                    </span>
                    
                    {conversation.unread_count > 0 && (
                      <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;
