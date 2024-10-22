import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import defaultImage from '../assets/baixados.png'; 
import config from '../config/Config';
import '../styles/Inicial.css'; 

const Inicial = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [freelancer, setFreelancer] = useState(null);
  const [userId, setUserId] = useState(location.state?.userId || null);
  const [projetos, setProjetos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [hours, setHours] = useState(0);
  const [rate, setRate] = useState(0);
  const [total, setTotal] = useState(0);
  const [visibleProjects, setVisibleProjects] = useState(8); // Estado para controlar a quantidade de projetos visíveis
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(() => {
    const savedPreference = sessionStorage.getItem('showSidebar');
    return savedPreference ? JSON.parse(savedPreference) : true;
  }); // Estado para controlar a visibilidade da sidebar
  const [randomProjeto, setRandomProjeto] = useState(null); // Estado para armazenar o projeto aleatório

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem('user'));
    const freelancerData = JSON.parse(sessionStorage.getItem('freelancer'));
    if (userData) {
      setUser(userData);
    }
    if (freelancerData) {
      setFreelancer(freelancerData);
    }
  }, []);

  useEffect(() => {
    const fetchProjetos = async () => {
      try {
        const response = await axios.get(`${config.LocalApi}/projetos`);
        setProjetos(response.data.reverse()); // Inverte a lista de projetos
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjetos();
  }, []);

  useEffect(() => {
    fetchRandomProjeto(); // Buscar um projeto aleatório inicialmente
    const interval = setInterval(fetchRandomProjeto, 10000); // Atualizar a cada 1 minuto
    return () => clearInterval(interval); // Limpar o intervalo quando o componente for desmontado
  }, [projetos]);

  const fetchRandomProjeto = () => {
    if (projetos.length > 0) {
      const randomIndex = Math.floor(Math.random() * projetos.length);
      setRandomProjeto(projetos[randomIndex]);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleSearchChange = async (event) => {
    const term = event.target.value;
    setSearchTerm(term);

    if (isSearchActive && term) {
      try {
        const response = await axios.get(`${config.LocalApi}/projetos/buscarProjetos?titulo=${term}`);
        setSearchResults(response.data.reverse()); // Inverte a lista de resultados de busca
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

  const handleCalculate = () => {
    setTotal(hours * rate);
  };

  const handleProjetoClick = (id) => {
    navigate(`/detalhes-projeto/${id}`);
  };

  const handleLoadMore = () => {
    setVisibleProjects((prevVisibleProjects) => prevVisibleProjects + 8);
  };

  const handleNewProjectClick = () => {
    navigate('/newProject');
  };
  
  useEffect(() => {
    const storedSidebarState = sessionStorage.getItem('showSidebar');
    if (storedSidebarState !== null) {
      setIsSidebarVisible(JSON.parse(storedSidebarState));
    }
  }, []);

  const toggleSidebar = () => {
    const newVisibility = !isSidebarVisible;
    setIsSidebarVisible(newVisibility);
    sessionStorage.setItem('showSidebar', JSON.stringify(newVisibility));
  };

  const handleRequestParticipation = async (projetoId) => {
    try {
      const response = await axios.post(`${config.LocalApi}/projetos/${projetoId}/solicitarParticipacao`, {}, {
        headers: {
          'userId': user.id
        }
      });
      if (response.status === 200) {
        alert('Solicitação enviada com sucesso!');
      } else {
        alert('Erro ao enviar solicitação.');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao enviar solicitação.');
    }
  };

  const projetosToDisplay = searchTerm ? searchResults : projetos;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="initial-top"></div>
      <div style={{ display: 'flex' }}>
        {isSidebarVisible && <Sidebar />}
        <div className="container" style={{ marginLeft: isSidebarVisible ? '250px' : '155px' }}>
          <Header onLogout={handleLogoutClick} onSearchChange={handleSearchChange} onSearchFocus={handleSearchFocus} />
          <button onClick={toggleSidebar} className="toggle-sidebar-button">
            {isSidebarVisible ? <i className="fas fa-times"></i> : <i className="fas fa-bars"></i>}
          </button>
          <div className="feed">
            {loading ? (
              <p>Carregando projetos...</p>
            ) : error ? (
              <p>Erro ao carregar os projetos: {error.message}</p>
            ) : (
              <div style={{ paddingTop: '60px' }}>
                {projetosToDisplay.slice(0, visibleProjects).map(projeto => (
                  <div key={projeto.id} className="card" onClick={() => handleProjetoClick(projeto.id)}>
                    <img src={projeto.capaUrl ? `${config.LocalApi}/projetos/${projeto.id}/capa` : defaultImage} alt="Capa do Projeto" />
                    <h1>{projeto.titulo}</h1>
                    <p><strong>Descrição:</strong> {projeto.descricao}</p>
                    <p><strong>Tecnologia:</strong> {projeto.tecnologia}</p>
                  </div>
                ))}
                {visibleProjects < projetosToDisplay.length && (
                  <div className="load-more" onClick={handleLoadMore}>
                    <span className="line"></span>
                    <span className="text">Exibir Mais</span>
                    <span className="line"></span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="initial-payments-feed">
            {freelancer ? (
              <div className="initial-payments-card">
                <h2>Simular Valor do Freelancer</h2>
                <div>
                  <label>Horas Trabalhadas:</label>
                  <input type="number" value={hours} onChange={(e) => setHours(e.target.value)} />
                </div>
                <div>
                  <label>Taxa por Hora:</label>
                  <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
                </div>
                <button onClick={handleCalculate}>Calcular</button>
                <p>Total: {total}</p>
              </div>
            ) : (
              <div className="initial-payments-card">
                <h2>Calcular Custo do Projeto</h2>
                <div>
                  <label>Horas Trabalhadas:</label>
                  <input type="number" value={hours} onChange={(e) => setHours(e.target.value)} />
                </div>
                <div>
                  <label>Taxa por Hora:</label>
                  <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
                </div>
                <button onClick={handleCalculate}>Calcular</button>
                <p>Total: {total}</p>
              </div>
            )}
            <div className="initial-anuncio-card">
              {randomProjeto ? (
                <>
                  <img 
                    src={randomProjeto.capaUrl ? `${config.LocalApi}/projetos/${randomProjeto.id}/capa` : defaultImage} 
                    alt="Capa do Projeto" 
                    style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                  <h2>{randomProjeto.titulo}</h2>
                  <p><strong>Tecnologia:</strong> {randomProjeto.tecnologia}</p>
                  <button onClick={() => handleRequestParticipation(randomProjeto.id)}>Ingressar</button>
                  <a href={`/detalhes-projeto/${randomProjeto.id}`} style={{ display: 'block', marginTop: '10px' }}>Saiba mais</a>
                </>
              ) : (
                <p>Carregando anúncio...</p>
              )}
            </div>
          </div>
        </div>
        {showLogoutModal && (
          <LogoutModal onConfirm={handleConfirmLogout} onCancel={handleCancelLogout} />
        )}
        <button className="floating-button" onClick={handleNewProjectClick}>+</button>
      </div>
    </div>
  );
};

const LogoutModal = ({ onConfirm, onCancel }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Você deseja sair?</h2>
      <div className="modal-buttons">
        <button onClick={onConfirm}>Confirmar</button>
        <button onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  </div>
);

export default Inicial;