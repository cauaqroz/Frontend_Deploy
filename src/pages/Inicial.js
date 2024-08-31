import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ProjetosContext } from '../context/ProjetosContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import defaultImage from '../assets/baixados.png'; // Importe a imagem
import '../styles/Inicial.css'; // Importe o CSS

const Inicial = () => {
  const navigate = useNavigate();
  const { projetos, loading, error } = useContext(ProjetosContext);
  const [user, setUser] = useState(null);
  const [freelancer, setFreelancer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [hours, setHours] = useState(0);
  const [rate, setRate] = useState(0);
  const [total, setTotal] = useState(0);

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

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  const handleSearchChange = async (event) => {
    const term = event.target.value;
    setSearchTerm(term);

    if (isSearchActive && term) {
      try {
        const response = await axios.get(`https://backend-conecta-09de4578e9de.herokuapp.com/projetos/buscarProjetos?titulo=${term}`);
        setSearchResults(response.data);
      } catch (err) {
        console.error('Erro ao buscar projetos:', err);
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

  if (!user) return <p>Carregando...</p>;
  if (loading) return <p>Carregando projetos...</p>;
  if (error) return <p>Erro ao carregar os projetos: {error.message}</p>;

  const projetosToDisplay = searchTerm ? searchResults : projetos;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div className="container">
        <div className="feed">
          <Header onLogout={handleLogout} onSearchChange={handleSearchChange} onSearchFocus={handleSearchFocus} />
          <div style={{ paddingTop: '60px' }}>
            {projetosToDisplay.map(projeto => (
              <div key={projeto.id} className="card" onClick={() => handleProjetoClick(projeto.id)}>
                <img src={projeto.capaUrl ? `https://backend-conecta-09de4578e9de.herokuapp.com/projetos/${projeto.id}/capa` : defaultImage} alt="Capa do Projeto" />
                <h1>{projeto.titulo}</h1>
                <p><strong>Descrição:</strong> {projeto.descricao}</p>
                <p><strong>Tecnologia:</strong> {projeto.tecnologia}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="initial-payments-feed">
          {freelancer ? (
            <div className="initial-payments-card">
              <h2>Simular Valor do Freelancer</h2>
              <div>
                <label>Horas Trabalhadas:</label>
                <input type="number" value={hours} onChange={(e) => setHours(Number(e.target.value))} />
              </div>
              <div>
                <label>Taxa por Hora:</label>
                <input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
              </div>
              <button onClick={handleCalculate}>Calcular</button>
              <p>Total: {total}</p>
            </div>
          ) : (
            <div className="initial-payments-card">
              <h2>Calcular Custo do Projeto</h2>
              <div>
                <label>Horas Trabalhadas:</label>
                <input type="number" value={hours} onChange={(e) => setHours(Number(e.target.value))} />
              </div>
              <div>
                <label>Taxa por Hora:</label>
                <input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
              </div>
              <button onClick={handleCalculate}>Calcular</button>
              <p>Total: {total}</p>
            </div>
          )}
          <div className="initial-anuncio-card">
            <h2>Anúncio</h2>
            <p>Este é um espaço para anúncios.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inicial;