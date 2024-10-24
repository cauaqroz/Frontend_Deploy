import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import defaultImage from '../assets/baixados.png';
import config from '../config/Config';
import '../styles/Projetos.css';
import { useState, useEffect, useRef } from 'react';

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
  const [loading, setLoading] = useState(true); // Estado de carregamento
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
      const response = await fetch(`${config.LocalApi}/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProjetosCriados(data.projetosCriados || []);
        setProjetosParticipando(data.projetosParticipando || []);
      } else {
        console.error('Erro ao buscar projetos do usuário');
      }
    } catch (error) {
      console.error('Erro ao buscar projetos do usuário:', error);
    } finally {
      setLoading(false); // Finaliza o carregamento
    }
  };
    const handleCancel = () => {
    document.getElementById('titulo').value = selectedProjeto.titulo;
    document.getElementById('descricao').value = selectedProjeto.descricao;
    document.getElementById('tecnologia').value = selectedProjeto.tecnologia;
  };

  useEffect(() => {
    if (selectedProjeto) {
      fetch(`${config.LocalApi}/projetos/${selectedProjeto.id}/pedidosParticipacao`)
        .then(response => response.json())
        .then(ids => {
          Promise.all(ids.map(id => fetch(`${config.LocalApi}/users/${id}`).then(res => res.json())))
            .then(users => setSolicitacoes(users));
        });

      if (selectedProjeto.chatId) {
        fetch(`${config.LocalApi}/chat/${selectedProjeto.chatId}/messages`)
          .then(response => response.json())
          .then(data => setMensagens(data));
      }

      if (selectedProjeto.approvedParticipants && selectedProjeto.approvedParticipants.length > 0) {
        Promise.all(selectedProjeto.approvedParticipants.map(id => fetch(`${config.LocalApi}/users/${id}`).then(res => res.json())))
          .then(users => setParticipantesAprovados(users));
      } else {
        setParticipantesAprovados([]);
      }
    }
  }, [selectedProjeto]);

  useEffect(() => {
    let interval;
    if (activeTab === 'canal' && selectedProjeto) {
      interval = setInterval(() => {
        fetch(`${config.LocalApi}/chat/${selectedProjeto.chatId}/messages`)
          .then(response => response.json())
          .then(data => setMensagens(data));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTab, selectedProjeto]);

  useEffect(() => {
    if (activeTab === 'canal' && shouldScroll && mensagensEndRef.current) {
      mensagensEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setShouldScroll(false);
    }
  }, [activeTab, mensagens, shouldScroll]);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  const handleProjetoClick = (projeto) => {
    setSelectedProjeto(projeto);
    setShouldScroll(true);
  };

  const handleBackToMenu = () => {
    setSelectedProjeto(null);
  };

  const handleAprovar = (userId) => {
    if (selectedProjeto && user) {
      fetch(`${config.LocalApi}/projetos/${selectedProjeto.id}/aprovarUsuario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ownerId': user.id
        },
        body: JSON.stringify({ userId })
      })
      .then(response => {
        if (response.ok) {
          setSolicitacoes(solicitacoes.filter(user => user.id !== userId));
        } else {
          console.error('Erro ao aprovar solicitação');
        }
      })
      .catch(error => console.error('Erro ao aprovar solicitação:', error));
    }
  };

  const handleNegar = (userId) => {
    if (selectedProjeto && user) {
      fetch(`${config.LocalApi}/projetos/${selectedProjeto.id}/negarSolicitacao/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'ownerId': user.id
        }
      })
      .then(response => {
        if (response.ok) {
          setSolicitacoes(solicitacoes.filter(user => user.id !== userId));
        } else {
          console.error('Erro ao negar solicitação');
        }
      })
      .catch(error => console.error('Erro ao negar solicitação:', error));
    }
  };

  const handleUpdateProjeto = async (updatedProjeto) => {
    if (!selectedProjeto || !user) return;

    try {
      const response = await fetch(`${config.LocalApi}/projetos/${selectedProjeto.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'ownerId': user.id
        },
        body: JSON.stringify(updatedProjeto)
      });

      if (response.ok) {
        const updatedData = await response.json();
        setSelectedProjeto(updatedData);
        alert('Projeto atualizado com sucesso!');
      } else {
        console.error('Erro ao atualizar projeto:', response.statusText);
      }
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
    }
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
  
    try {
      const response = await fetch(`${config.LocalApi}/chat/${selectedProjeto.chatId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: novaMensagem,
          sender: user.id,
          channelId: selectedProjeto.chatId // Adiciona o channelId ao corpo da requisição
        })
      });
  
      // Verificar se a resposta é bem-sucedida
      if (!response.ok) {
        throw new Error(`Erro na resposta do servidor: ${response.status} ${response.statusText}`);
      }
  
      // Tentar analisar o JSON da resposta
      const responseData = await response.json();
      console.log('Resposta do servidor:', responseData);
  
      // Atualizar a interface do usuário com a nova mensagem
      // Supondo que você tenha um estado para armazenar as mensagens
      setMensagens((prevMensagens) => [...prevMensagens, responseData]);
  
      // Limpar o campo de entrada de mensagem
      setNovaMensagem('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem: ' + error.message);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'informacoes':
        return (
          <>
            <h2>{selectedProjeto.titulo}</h2>
            <p>{selectedProjeto.descricao}</p>
            <p><strong>Tecnologia:</strong> {selectedProjeto.tecnologia}</p>
            <div className="arquivos">
              <h3>Arquivos</h3>
            </div>
          </>
        );
        case 'solicitacoes':
          return (
            <div className="solicitacoes-card">
              <h3>Lista de Solicitações</h3>
              {solicitacoes.length > 0 ? (
                solicitacoes.map(user => (
                  <div key={user.id} className="solicitacao-item">
                    <p>{user.name} {user.lastName}</p>
                    <div className="solicitacao-buttons">
                      <button className="btn-approve" onClick={() => handleAprovar(user.id)}>Aprovar</button>
                      <button className="btn-reject" onClick={() => handleNegar(user.id)}>Recusar</button>
                    </div>
                  </div>
                ))
              ) : (
                <p>Nenhuma solicitação encontrada.</p>
              )}
            </div>
          );
      case 'participantes':
        return (
          <div className="participantes-card">
            <h3>Lista de Participantes</h3>
            {participantesAprovados.length > 0 ? (
              participantesAprovados.map(user => (
                <div key={user.id} className="participante-item">
                  <p>{user.name} {user.lastName}</p>
                </div>
              ))
            ) : (
              <p>Nenhum participante encontrado.</p>
            )}
          </div>
        );
      case 'canal':
        return (
          <div className="canal-card">
            <h3>Canal de Comunicação</h3>
            <div className="mensagens">
              {mensagens.map(mensagem => (
                <div key={mensagem.createdDate} className={`mensagem ${mensagem.sender === user.id ? 'mensagem-direita' : 'mensagem-esquerda'}`}>
                  {mensagem.sender !== user.id && <p><strong>{mensagem.senderName}</strong></p>}
                  <p>{mensagem.content}</p>
                  <span>{new Date(mensagem.createdDate).toLocaleString()}</span>
                </div>
              ))}
              <div ref={mensagensEndRef} />
            </div>
            <div className="nova-mensagem">
              <input
                type="text"
                value={novaMensagem}
                onChange={(e) => setNovaMensagem(e.target.value)}
                placeholder="Digite sua mensagem"
              />
              <button onClick={enviarMensagem}>Enviar</button>
            </div>
          </div>
        );
        case 'configuracoes':
  return (
    <div className="configuracoes-container">
      <h2>Configurações do Projeto</h2>
      <form 
        className="configuracoes-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const updatedProjeto = {
            titulo: e.target.titulo.value,
            descricao: e.target.descricao.value,
            tecnologia: e.target.tecnologia.value
          };
          handleUpdateProjeto(updatedProjeto);
        }}
      >
        <div className="form-group">
          <label htmlFor="titulo">Título:</label>
          <input type="text" id="titulo" name="titulo" defaultValue={selectedProjeto.titulo} />
        </div>
        <div className="form-group">
          <label htmlFor="descricao">Descrição:</label>
          <textarea id="descricao" name="descricao" defaultValue={selectedProjeto.descricao}></textarea>
        </div>
        <div className="form-group">
          <label htmlFor="tecnologia">Tecnologia:</label>
          <input type="text" id="tecnologia" name="tecnologia" defaultValue={selectedProjeto.tecnologia} />
        </div>
        <div className="form-buttons">
          <button type="button" className="btn-cancel" onClick={handleCancel}>Cancelar</button>
          <button type="submit" className="btn-submit">Salvar</button>
        </div>
      </form>
      <button onClick={handleDeleteProjeto} className="btn-delete">Deletar</button>
    </div>
  );
default:
  return null;
}
  };

  const toggleSidebar = () => {
    const newVisibility = !isSidebarVisible;
    setIsSidebarVisible(newVisibility);
    sessionStorage.setItem('showSidebar', JSON.stringify(newVisibility));
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
                    <button onClick={() => { setActiveTab('canal'); setShouldScroll(true); }} className={activeTab === 'canal' ? 'active' : ''}>Canal</button>
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