import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjetosUsuarioContext } from '../context/ProjetosUsuarioContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import defaultImage from '../assets/baixados.png'; // Importe a imagem
import '../styles/Projetos.css'; // Importe o CSS

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
      setUser(userData);};
  }, []); useEffect(() => {
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
  }, [activeTab, mensagens, shouldScroll]);const handleLogout = () => {
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
      fetch(`https://backend-conecta-09de4578e9de.herokuapp.com/projetos/${selectedProjeto.id}/negarSolicitacao/${userId}`, {
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
  };const handleUpdateProjeto = async (updatedProjeto) => {
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
    if (novaMensagem.trim() === '') return;try {
      const response = await fetch(`https://backend-conecta-09de4578e9de.herokuapp.com/chat/${selectedProjeto.chatId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: novaMensagem,
          sender: user.id
        })
      });if (response.ok) {
        setNovaMensagem('');
        fetch(`https://backend-conecta-09de4578e9de.herokuapp.com/chat/${selectedProjeto.chatId}/messages`)
          .then(response => response.json())
          .then(data => setMensagens(data));
      } else {
        console.error('Erro ao enviar mensagem:', response.statusText);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }};
  const renderTabContent = () => {
    switch (activeTab) {
      case 'informacoes':
        return (
          <>
            <h2>{selectedProjeto.titulo}</h2>
            <p>{selectedProjeto.descricao}</p><p><strong>Tecnologia:</strong> {selectedProjeto.tecnologia}</p>
            <div className="arquivos">
              <h3>Arquivos</h3></div>
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
                  <button onClick={() => handleAprovar(user.id)}>Aprovar</button>
                  <button onClick={() => handleNegar(user.id)}>Negar</button>
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
          <div>
            <h2>Configurações do Projeto</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const updatedProjeto = {
                titulo: e.target.titulo.value,
                descricao: e.target.descricao.value,
                tecnologia: e.target.tecnologia.value
              };
              handleUpdateProjeto(updatedProjeto);
            }}>
              <div>
                <label>Título:</label>
                <input type="text" name="titulo" defaultValue={selectedProjeto.titulo} />
              </div>
              <div>
                <label>Descrição:</label>
                <textarea name="descricao" defaultValue={selectedProjeto.descricao}></textarea>
              </div>
              <div>
                <label>Tecnologia:</label>
                <input type="text" name="tecnologia" defaultValue={selectedProjeto.tecnologia} />
              </div>
              <button type="submit">Atualizar Projeto</button>
            </form>
            <button onClick={handleDeleteProjeto} style={{ marginTop: '20px', color: 'red' }}>Deletar Projeto</button>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) return <p>Carregando projetos...</p>;
  if (error) return <p>Erro ao carregar os projetos: {error.message}</p>;

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
                  close</span>
                <div className="project-card">
                  <img 
                    src={selectedProjeto.capaUrl ? `https://backend-conecta-09de4578e9de.herokuapp.com/projetos/${selectedProjeto.id}/capa` : defaultImage} 
                    alt="Capa do Projeto" 
                  />
                  <h1>{selectedProjeto.titulo}</h1></div>
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
                          src={projeto.capaUrl ? `https://backend-conecta-09de4578e9de.herokuapp.com/projetos/${projeto.id}/capa` : defaultImage} 
                          alt="Capa do Projeto" 
                          className="project-image"/>
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
                        <img src={projeto.capaUrl ? `https://backend-conecta-09de4578e9de.herokuapp.com/projetos/${projeto.id}/capa` : defaultImage} 
                          alt="Capa do Projeto" 
                          className="project-image"/>
          
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
        </div>
      </div>
    </div>
  );
};

export default Projetos;