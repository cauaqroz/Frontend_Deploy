import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import config from '../config';
import defaultImage from '../assets/defaultImage.png';

const Projetos = () => {
  const [user, setUser] = useState(null);
  const [projetosCriados, setProjetosCriados] = useState([]);
  const [projetosParticipando, setProjetosParticipando] = useState([]);
  const [selectedProjeto, setSelectedProjeto] = useState(null);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [activeTab, setActiveTab] = useState('informacoes');
  const [shouldScroll, setShouldScroll] = useState(true);
  const [participantesAprovados, setParticipantesAprovados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarVisible, setIsSidebarVisible] = useState(() => {
    const savedPreference = sessionStorage.getItem('showSidebar');
    return savedPreference ? JSON.parse(savedPreference) : true;
  });
  const navigate = useNavigate();
  const mensagensEndRef = useRef(null);

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem('user'));
    if (userData) {
      setUser(userData);
      fetchProjetos(userData.id);
    }
  }, []);

  const fetchProjetos = async (userId) => {
    try {
      const response = await fetch(`${config.LocalApi}/projetos?userId=${userId}`);
      const data = await response.json();
      setProjetosCriados(data.criados);
      setProjetosParticipando(data.participando);
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    document.getElementById('titulo').value = selectedProjeto.titulo;
    document.getElementById('descricao').value = selectedProjeto.descricao;
    document.getElementById('tecnologia').value = selectedProjeto.tecnologia;
  };

  useEffect(() => {
    if (selectedProjeto) {
      // Fetch additional data for the selected project
    }
  }, [selectedProjeto]);

  useEffect(() => {
    let interval;
    if (activeTab === 'canal' && selectedProjeto) {
      // Fetch messages periodically
    }
    return () => clearInterval(interval);
  }, [activeTab, selectedProjeto]);

  useEffect(() => {
    if (shouldScroll && mensagensEndRef.current) {
      mensagensEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, mensagens, shouldScroll]);

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  const handleProjetoClick = (projeto) => {
    setSelectedProjeto(projeto);
  };

  const handleBackToMenu = () => {
    setSelectedProjeto(null);
  };

  const handleAprovar = (userId) => {
    // Approve user logic
  };

  const handleNegar = (userId) => {
    // Deny user logic
  };

  const handleUpdateProjeto = async (updatedProjeto) => {
    // Update project logic
  };

  const handleNewProjectClick = () => {
    navigate('/newProject');
  };

  const handleDeleteProjeto = async () => {
    if (!selectedProjeto || !user) return;

    try {
      const response = await fetch(`${config.LocalApi}/projetos/${selectedProjeto.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'ownerId': user.id
        }
      });

      if (response.ok) {
        console.log('Projeto deletado com sucesso');
        fetchProjetos(user.id);
        setSelectedProjeto(null);
      } else {
        console.error('Erro ao deletar projeto');
      }
    } catch (error) {
      console.error('Erro ao deletar projeto:', error);
    }
  };

  const enviarMensagem = async () => {
    if (novaMensagem.trim() === '') return;
  
    console.log('Enviando mensagem:', novaMensagem);
  
    // Limpar o campo de entrada de mensagem imediatamente
    setNovaMensagem('');
  
    try {
      const response = await fetch(`${config.LocalApi}/chat/${selectedProjeto.chatId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: novaMensagem,
          sender: user.id,
          channelId: selectedProjeto.chatId
        })
      });
  
      if (!response.ok) {
        throw new Error(`Erro na resposta do servidor: ${response.status} ${response.statusText}`);
      }
  
      // A resposta já é um objeto JavaScript válido
      const responseData = await response.json();
      console.log('Resposta do servidor:', responseData);
  
      setMensagens((prevMensagens) => [...prevMensagens, responseData]);
  
      console.log('Mensagem enviada com sucesso');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'informacoes':
        return <div>Informações do Projeto</div>;
      case 'solicitacoes':
        return <div>Solicitações</div>;
      case 'participantes':
        return <div>Participantes</div>;
      case 'canal':
        return (
          <div>
            <div className="mensagens">
              {mensagens.map((mensagem, index) => (
                <div key={mensagem.id || index}>
                  <p>{mensagem.content}</p>
                </div>
              ))}
              <div ref={mensagensEndRef} />
            </div>
            <input
              type="text"
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              placeholder="Digite sua mensagem"
            />
            <button onClick={enviarMensagem}>Enviar</button>
          </div>
        );
      case 'configuracoes':
        return <div>Configurações</div>;
      default:
        return null;
    }
  };

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
    sessionStorage.setItem('showSidebar', JSON.stringify(!isSidebarVisible));
  };

  return (
    <div className="projects-page">
      <div className="initial-top"></div>
      {isSidebarVisible && <Sidebar activeTab="/projetos" />}
      <div className={`container-projects ${!isSidebarVisible ? 'sidebar-hidden' : ''}`}>
        <Header onLogout={handleLogout} selectedProjeto={selectedProjeto} />
        <button onClick={toggleSidebar} className="toggle-sidebar-button">
          {isSidebarVisible ? <i className="fas fa-times"></i> : <i className="fas fa-bars"></i>}
        </button>
        <div className={`projects-content ${!isSidebarVisible ? 'sidebar-hidden' : ''}`}>
          {loading ? (
            <div className="loading">Carregando...</div>
          ) : (
            <div className="projects-feed">
              {selectedProjeto ? (
                <div className="projects-detalhes full-screen">
                  <span className="material-symbols-outlined close-icon" onClick={handleBackToMenu} style={{ cursor: 'pointer' }}>
                    close
                  </span>
                  <div className="project-card">
                    <img 
                      src={selectedProjeto.capaUrl ? `${config.LocalApi}/projetos/${selectedProjeto.id}/capa` : defaultImage} 
                      alt="Capa do Projeto" 
                    />
                    <h1>{selectedProjeto.titulo}</h1>
                  </div>
                  <div className="tabs">
                    <button onClick={() => setActiveTab('informacoes')} className={activeTab === 'informacoes' ? 'active' : ''}>Informações</button>
                    <button onClick={() => setActiveTab('solicitacoes')} className={activeTab === 'solicitacoes' ? 'active' : ''}>Solicitações</button>
                    <button onClick={() => setActiveTab('participantes')} className={activeTab === 'participantes' ? 'active' : ''}>Participantes</button>
                    <button onClick={() => setActiveTab('canal')} className={activeTab === 'canal' ? 'active' : ''}>Canal</button>
                    <button onClick={() => setActiveTab('configuracoes')} className={activeTab === 'configuracoes' ? 'active' : ''}>Configurações</button>
                  </div>
                  <div className="tab-content">
                    {renderTabContent()}
                  </div>
                </div>
              ) : (
                <>
                  <h2>Seus Projetos</h2>
                  <div className="projects-grid">
                    {projetosCriados.length > 0 ? (
                      projetosCriados.map(projeto => (
                        <div key={projeto.id} className="projects-item" onClick={() => handleProjetoClick(projeto)}>
                          <img 
                            src={projeto.capaUrl ? `${config.LocalApi}/projetos/${projeto.id}/capa` : defaultImage} 
                            alt="Capa do Projeto" 
                            className="project-image"
                            onError={(e) => { e.target.src = defaultImage; }} 
                          />
                          <h2>{projeto.titulo}</h2>
                          <p>{projeto.descricao}</p>
                          <p><strong>Tecnologia:</strong> {projeto.tecnologia}</p>
                        </div>
                      ))
                    ) : (
                      <p>Nenhum projeto encontrado.</p>
                    )}
                  </div>
                  <br></br>
                  <h2>Participando</h2>
                  <div className="projects-grid">
                    {projetosParticipando.length > 0 ? (
                      projetosParticipando.map(projeto => (
                        <div key={projeto.id} className="projects-item" onClick={() => handleProjetoClick(projeto)}>
                          <img 
                            src={projeto.capaUrl ? `${config.LocalApi}/projetos/${projeto.id}/capa` : defaultImage} 
                            alt="Capa do Projeto" 
                            className="project-image"
                            onError={(e) => { e.target.src = defaultImage; }} 
                          />
                          <h2>{projeto.titulo}</h2>
                          <p>{projeto.descricao}</p>
                          <p><strong>Tecnologia:</strong> {projeto.tecnologia}</p>
                        </div>
                      ))
                    ) : (
                      <p>Nenhum projeto encontrado.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <button className="floating-button" onClick={handleNewProjectClick}>+</button>
    </div>
  );
};

export default Projetos;