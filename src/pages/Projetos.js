import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjetosUsuarioContext } from '../context/ProjetosUsuarioContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import defaultImage from '../assets/baixados.png';
import '../styles/Projetos.css';

const Projetos = () => {
  const navigate = useNavigate();
  const { projetosCriados, projetosParticipando, loading, error } = useContext(ProjetosUsuarioContext);
  const [user, setUser] = useState(null);
  const [selectedProjeto, setSelectedProjeto] = useState(null);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [activeTab, setActiveTab] = useState('informacoes');
  const [shouldScroll, setShouldScroll] = useState(true);
  const [participantesAprovados, setParticipantesAprovados] = useState([]);
  const mensagensEndRef = useRef(null);

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem('user'));
    if (userData) {
      setUser(userData);
    }
  }, []);

  useEffect(() => {
    if (selectedProjeto) {
      fetch(`https://backend-conecta-09de4578e9de.herokuapp.com/projetos/${selectedProjeto.id}/pedidosParticipacao`)
        .then(response => response.json())
        .then(ids => {
          Promise.all(ids.map(id => fetch(`https://backend-conecta-09de4578e9de.herokuapp.com/users/${id}`).then(res => res.json())))
            .then(users => setSolicitacoes(users));
        });

      if (selectedProjeto.chatId) {
        fetch(`https://backend-conecta-09de4578e9de.herokuapp.com/chat/${selectedProjeto.chatId}/messages`)
          .then(response => response.json())
          .then(data => setMensagens(data));
      }

      if (selectedProjeto.approvedParticipants && selectedProjeto.approvedParticipants.length > 0) {
        Promise.all(selectedProjeto.approvedParticipants.map(id => fetch(`https://backend-conecta-09de4578e9de.herokuapp.com/users/${id}`).then(res => res.json())))
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
        fetch(`https://backend-conecta-09de4578e9de.herokuapp.com/chat/${selectedProjeto.chatId}/messages`)
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
      fetch(`https://backend-conecta-09de4578e9de.herokuapp.com/projetos/${selectedProjeto.id}/aprovarUsuario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ownerId': user.id
        },
        body: JSON.stringify({ userId })
      })
      .then(response => {
        if (response.ok) {
          // Atualize a lista de solicitações
          setSolicitacoes(solicitacoes.filter(solicitacao => solicitacao.id !== userId));
        } else {
          console.error('Erro ao aprovar solicitação:', response.statusText);
        }
      })
      .catch(error => console.error('Erro ao aprovar solicitação:', error));
    }
  };

  const handleNegar = (userId) => {
    if (selectedProjeto && user) {
      fetch(`https://backend-conecta-09de4578e9de.herokuapp.com/projetos/${selectedProjeto.id}/negarSolicitacao/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'ownerId': user.id
        }
      })
      .then(response => {
        if (response.ok) {
          // Atualize a lista de solicitações
          setSolicitacoes(solicitacoes.filter(solicitacao => solicitacao.id !== userId));
        } else {
          console.error('Erro ao negar solicitação:', response.statusText);
        }
      })
      .catch(error => console.error('Erro ao negar solicitação:', error));
    }
  };

  const handleUpdateProjeto = async (updatedProjeto) => {
    if (!selectedProjeto || !user) return;

    try {
      const response = await fetch(`https://backend-conecta-09de4578e9de.herokuapp.com/projetos/${selectedProjeto.id}`, {
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

  const handleDeleteProjeto = async () => {
    if (!selectedProjeto || !user) return;

    try {
      const response = await fetch(`https://backend-conecta-09de4578e9de.herokuapp.com/projetos/${selectedProjeto.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'ownerId': user.id
        }
      });

      if (response.ok) {
        console.log('Projeto deletado com sucesso');
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
    try {
      const response = await fetch(`https://backend-conecta-09de4578e9de.herokuapp.com/chat/${selectedProjeto.chatId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: novaMensagem,
          sender: user.id
        })
      });
      if (response.ok) {
        setNovaMensagem('');
        fetch(`https://backend-conecta-09de4578e9de.herokuapp.com/chat/${selectedProjeto.chatId}/messages`)
          .then(response => response.json())
          .then(data => setMensagens(data));
      } else {
        console.error('Erro ao enviar mensagem:', response.statusText);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'informacoes':
        return <div>Informações do Projeto</div>;
      case 'solicitacoes':
        return (
          <div>
            <h3>Solicitações de Participação</h3>
            {solicitacoes.map(solicitacao => (
              <div key={solicitacao.id}>
                <p>{solicitacao.nome}</p>
                <button onClick={() => handleAprovar(solicitacao.id)}>Aprovar</button>
                <button onClick={() => handleNegar(solicitacao.id)}>Negar</button>
              </div>
            ))}
          </div>
        );
      case 'participantes':
        return (
          <div>
            <h3>Participantes Aprovados</h3>
            {participantesAprovados.map(participante => (
              <div key={participante.id}>
                <p>{participante.nome}</p>
              </div>
            ))}
          </div>
        );
      case 'canal':
        return (
          <div>
            <h3>Canal de Mensagens</h3>
            <div className="mensagens">
              {mensagens.map((mensagem, index) => (
                <div key={index}>
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
        return (
          <div>
            <h3>Configurações do Projeto</h3>
            <button onClick={handleDeleteProjeto}>Deletar Projeto</button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="projects-page">
      <Sidebar activeTab="/projetos" />
      <div className="container-projects">
        <Header onLogout={handleLogout} />
        <div className="projects-content">
          <div className="projects-feed">
            {selectedProjeto ? (
              <div className="projects-detalhes full-screen">
                <span className="material-symbols-outlined close-icon" onClick={handleBackToMenu} style={{ cursor: 'pointer' }}>
                  close
                </span>
                <div className="project-card">
                  <img
                    src={selectedProjeto.capaUrl ? `https://backend-conecta-09de4578e9de.herokuapp.com/projetos/${selectedProjeto.id}/capa` : defaultImage}
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
                {loading ? (
                  <p>Carregando projetos...</p>
                ) : (
                  <div className="projects-grid">
                    {projetosCriados.length > 0 ? (
                      projetosCriados.map(projeto => (
                        <div key={projeto.id} className="projects-item" onClick={() => handleProjetoClick(projeto)}>
                          <img
                            src={projeto.capaUrl ? `https://backend-conecta-09de4578e9de.herokuapp.com/projetos/${projeto.id}/capa` : defaultImage}
                            alt="Capa do Projeto"
                            className="project-image"
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
                )}
                <br />
                <h2>Participando</h2>
                {loading ? (
                  <p>Carregando projetos...</p>
                ) : (
                  <div className="projects-grid">
                    {projetosParticipando.length > 0 ? (
                      projetosParticipando.map(projeto => (
                        <div key={projeto.id} className="projects-item" onClick={() => handleProjetoClick(projeto)}>
                          <img
                            src={projeto.capaUrl ? `https://backend-conecta-09de4578e9de.herokuapp.com/projetos/${projeto.id}/capa` : defaultImage}
                            alt="Capa do Projeto"
                            className="project-image"
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
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projetos;