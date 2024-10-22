import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Sidebar.css';

const Sidebar = ({ activeTab }) => {
  const location = useLocation();
  const [currentTab, setCurrentTab] = useState(location.pathname);

  useEffect(() => {
    if (activeTab) {
      setCurrentTab(activeTab);
    }
  }, [activeTab]);

  return (
    <div className="sidebar">
      <h2>ConectaPlus</h2>
      <div className="menu-section">
        <h5>Menu</h5>
        <ul>
          <li className={currentTab === '/inicial' ? 'active' : ''}>
            <Link to="/inicial" onClick={() => setCurrentTab('/inicial')}>Inicio</Link>
          </li>
          <li className={currentTab === '/projetos' ? 'active' : ''}>
            <Link to="/projetos" onClick={() => setCurrentTab('/projetos')}>Projetos</Link>
          </li>

        </ul>
      </div>
      <div className="social-section">
        <h5>Social</h5>
        <ul>
          <li className={currentTab === '/friends' ? 'active' : ''}>
            <Link to="/friends" onClick={() => setCurrentTab('/friends')}>Pessoas</Link>
          </li>
          <li className={currentTab === '/channel' ? 'active' : ''}>
            <Link to="/channel" onClick={() => setCurrentTab('/channel')}>Conversas</Link>
          </li>
        </ul>
      </div>
      <div className="general-section">
        <h5>Geral</h5>
        <ul>
        <li className={currentTab === '/updates' ? 'active' : ''}>
            <Link to="/updates" onClick={() => setCurrentTab('/updates')}>Novidades</Link>
          </li>
          <li className={currentTab === '/account' ? 'active' : ''}>
            <Link to="/account" onClick={() => setCurrentTab('/account')}>Configuração</Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;

