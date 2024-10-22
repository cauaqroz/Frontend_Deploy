import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import axios from 'axios';
import config from '../config/Config';
import '../styles/Canais.css';

const Canais = () => {
  const [friends, setFriends] = useState([]);
  const [channels, setChannels] = useState({});
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [expandedChannelId, setExpandedChannelId] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(() => {
    const savedPreference = sessionStorage.getItem('showSidebar');
    return savedPreference ? JSON.parse(savedPreference) : true;
  });

  useEffect(() => {
    const fetchFriendsAndChannels = async () => {
      const loggedInUser = JSON.parse(sessionStorage.getItem('user'));
      const friendsList = loggedInUser?.friends || [];

      const friendsData = [];
      for (const friendId of friendsList) {
        try {
          const friendResponse = await axios.get(`${config.LocalApi}/users/${friendId}`);
          if (friendResponse.status === 200) {
            friendsData.push(friendResponse.data);
          }
        } catch (error) {
          console.error(`Erro ao buscar detalhes do amigo com ID: ${friendId}:`, error);
        }
      }
      setFriends(friendsData);

      const channelsData = {};
      for (const friend of friendsData) {
        try {
          const channelResponse = await axios.get(`${config.LocalApi}/channels/between/${loggedInUser.id}/${friend.id}`);
          if (channelResponse.status === 200) {
            console.log(`Canal encontrado para o amigo com ID: ${friend.id}`, channelResponse.data);
            channelsData[friend.id] = channelResponse.data[0]; // Acessando o primeiro elemento do array
          }
        } catch (error) {
          console.error(`Erro ao buscar canal entre ${loggedInUser.id} e ${friend.id}:`, error);
        }
      }
      setChannels(channelsData);
      console.log('Canais carregados:', channelsData);
    };

    fetchFriendsAndChannels();
  }, []);

  useEffect(() => {
    let interval;
    if (selectedChannelId) {
      interval = setInterval(() => {
        fetch(`${config.LocalApi}/chat/${selectedChannelId}/messages`)
          .then(response => response.json())
          .then(data => setMessages(data));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [selectedChannelId]);

  const handleFriendClick = async (friendId) => {
    const channel = channels[friendId];
    if (channel) {
      setSelectedChannelId(channel.id);
      setMessages(channel.messages || []);
      setExpandedChannelId(friendId === expandedChannelId ? null : friendId); // Toggle dropdown
    } else {
      console.error(`Canal não encontrado para o amigo com ID: ${friendId}`);
    }
  };

  const enviarMensagem = async () => {
    if (newMessage.trim() === '' || !selectedChannelId) return;

    console.log('Enviando mensagem:', newMessage);

    try {
      const loggedInUser = JSON.parse(sessionStorage.getItem('user'));
      const response = await fetch(`${config.LocalApi}/chat/${selectedChannelId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newMessage,
          sender: loggedInUser.id
        })
      });

      const responseData = await response.json();
      console.log('Resposta do servidor:', responseData);

      if (response.ok) {
        console.log('Mensagem enviada com sucesso');
        setNewMessage('');
        fetch(`${config.LocalApi}/chat/${selectedChannelId}/messages`)
          .then(response => response.json())
          .then(data => setMessages(data));
      } else {
        console.error('Erro ao enviar mensagem:', response.statusText);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const toggleSidebar = () => {
    const newVisibility = !isSidebarVisible;
    setIsSidebarVisible(newVisibility);
    sessionStorage.setItem('showSidebar', JSON.stringify(newVisibility));
  };

  return (
    <div style={{ display: 'flex' }}>
      <div className="initial-top"></div>
      {isSidebarVisible && <Sidebar activeTab="/channel" />}
      <div className="container" style={{ marginLeft: isSidebarVisible ? '250px' : '50px' }}>
        <Header />
        <button onClick={toggleSidebar} className="toggle-sidebar-button">
          {isSidebarVisible ? <i className="fas fa-times"></i> : <i className="fas fa-bars"></i>}
        </button>
        <div className="channel-content">
          <div className="friends-list">
            {friends && friends.length > 0 ? (
              friends.map(friend => (
                <div key={friend.id}>
                  <div className="friend-card" onClick={() => handleFriendClick(friend.id)}>
                    <img src={friend.avatar ? `${config.LocalApi}/users/avatar/${friend.avatar}` : 'default-avatar.png'} alt={`${friend.name} ${friend.lastName}`} />
                    <div className="friend-card-info">
                      <h3>{friend.name} {friend.lastName}</h3>
                      <p>{friend.email}</p>
                    </div>
                  </div>
                  {expandedChannelId === friend.id && (
                    <div className="dropdown">
                      <div className="messages">
                        {messages.length > 0 ? (
                          messages.map((message, index) => (
                            <div key={index} className={`message ${message.sender === JSON.parse(sessionStorage.getItem('user')).id ? 'sent' : 'received'}`}>
                              <p>{message.content}</p>
                            </div>
                          ))
                        ) : (
                          <p>Nenhuma mensagem ainda.</p>
                        )}
                      </div>
                      <div className="message-input">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Digite sua mensagem..."
                        />
                        <button onClick={enviarMensagem}>Enviar</button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p>Nenhum amigo Adicionado.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Canais;