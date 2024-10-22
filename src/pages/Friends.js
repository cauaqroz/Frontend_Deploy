import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config/Config';
import '../styles/Peoples.css';

const Friends = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(() => {
    const savedPreference = sessionStorage.getItem('showSidebar');
    return savedPreference ? JSON.parse(savedPreference) : true;
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${config.LocalApi}/users`);
        if (response.status === 200) {
          const loggedInUser = JSON.parse(sessionStorage.getItem('user'));
          const friends = loggedInUser?.friends || []; // Inicializar como array vazio se não existir
          const filteredUsers = response.data.filter(user => user.id !== loggedInUser.id && !friends.includes(user.id));
          setUsers(filteredUsers);
        } else {
          setError('Erro ao buscar usuários: Resposta do servidor não é 200.');
        }
      } catch (error) {
        setError(`Erro ao buscar usuários: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleAddFriend = async (friendId) => {
    const loggedInUser = JSON.parse(sessionStorage.getItem('user'));
    const friends = loggedInUser?.friends || []; // Inicializar como array vazio se não existir
    if (friends.includes(friendId)) {
      alert('Este usuário já está na sua lista de amigos.');
      return;
    }

    try {
      const response = await axios.post(`${config.LocalApi}/users/addFriend`, {
        friendId: friendId
      }, {
        headers: {
          'Content-Type': 'application/json',
          'userId': loggedInUser.id
        }
      });
      if (response.status === 200) {
        alert('Usuário adicionado à lista de amigos com sucesso!');
        // Atualizar a lista de amigos no sessionStorage
        friends.push(friendId);
        loggedInUser.friends = friends;
        sessionStorage.setItem('user', JSON.stringify(loggedInUser));
        // Remover o usuário da lista exibida
        setUsers(users.filter(user => user.id !== friendId));
      } else {
        alert('Erro ao adicionar usuário à lista de amigos.');
      }
    } catch (error) {
      alert(`Erro ao adicionar usuário à lista de amigos: ${error.message}`);
    }
  };

  const handleUserClick = (email) => {
    navigate(`/perfil/${email}`);
  };

  const handleNewProjectClick = () => {
    navigate('/newProject');
  };

  const toggleSidebar = () => {
    const newVisibility = !isSidebarVisible;
    setIsSidebarVisible(newVisibility);
    sessionStorage.setItem('showSidebar', JSON.stringify(newVisibility));
  };

  return (
    <div style={{ display: 'flex' }}>
      <div className="initial-top"></div>
      {isSidebarVisible && <Sidebar activeTab="/friends" />}
      <div className="container" style={{ marginLeft: isSidebarVisible ? '250px' : '50px' }}>
        <Header />
        <button onClick={toggleSidebar} className="toggle-sidebar-button">
          {isSidebarVisible ? <i className="fas fa-times"></i> : <i className="fas fa-bars"></i>}
        </button>
        <div className="friends-content">
          {loading ? (
            <p>Carregando usuários...</p>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <ul className="friends-list">
              {users.map(user => (
                <li key={user.id} className="friend-item">
                  <div className="friend-card" onClick={() => handleUserClick(user.email)}>
                    <img src={user.avatar ? `${config.LocalApi}/users/avatar/${user.avatar}` : 'default-avatar.png'} alt={`${user.name} ${user.lastName}`} />
                    <div className="friend-card-info">
                      <h3>{user.name} {user.lastName}</h3>
                      <p>{user.email}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleAddFriend(user.id); }}>Add+</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <button className="floating-button" onClick={handleNewProjectClick}>+</button>
    </div>
  );
};

export default Friends;