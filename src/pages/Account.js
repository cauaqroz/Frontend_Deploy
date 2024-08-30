import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import '../styles/Account.css';




const Account = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [freelancer, setFreelancer] = useState(null);
    const [userId, setUserId] = useState(location.state?.userId || null);
    const [projetos, setProjetos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearchActive, setIsSearchActive] = useState(false);
   

    const handleLogout = () => {
        sessionStorage.clear();
        navigate('/login');
      };
    
      const handleSearchChange = async (event) => {
        const term = event.target.value;
        setSearchTerm(term);
    
        if (isSearchActive && term) {
          try {
            const response = await axios.get(`http://localhost:2216/projetos/buscarProjetos?titulo=${term}`);
            setSearchResults(response.data);
          } catch (err) {
            setError(err);
          }
        } else {
          setSearchResults([]);
        }
      };
    
      const handleSearchFocus = () => {
        setIsSearchActive(true);
      };
    

  return (
    <div className="account-page">
      <Sidebar activeTab="/account" />
      <div className="main-content">
        <Header onLogout={handleLogout} onSearchChange={handleSearchChange} onSearchFocus={handleSearchFocus} />
        <div className="account-content">
          <h2>Account Settings</h2>
          {/* Adicione aqui o conteúdo específico da página Account */}
        </div>
      </div>
    </div>
  );
};

export default Account;