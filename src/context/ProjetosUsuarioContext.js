import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const ProjetosUsuarioContext = createContext();

export const ProjetosUsuarioProvider = ({ children }) => {
  const [projetosCriados, setProjetosCriados] = useState([]);
  const [projetosParticipando, setProjetosParticipando] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjetos = async () => {
      const userData = JSON.parse(sessionStorage.getItem('user'));
      if (!userData) return;

      try {
        const response = await axios.get(`https://backend-conecta-09de4578e9de.herokuapp.com/users/${userData.id}`);
        setProjetosCriados(response.data.projetosCriados || []);
        setProjetosParticipando(response.data.projetosParticipando || []);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjetos();

    // Fazer requisições periódicas para atualizar os dados
    const intervalId = setInterval(fetchProjetos, 60000); // Atualiza a cada 60 segundos

    // Limpar o intervalo quando o componente for desmontado
    return () => clearInterval(intervalId);
  }, []);

  return (
    <ProjetosUsuarioContext.Provider value={{ projetosCriados, projetosParticipando, loading, error }}>
      {children}
    </ProjetosUsuarioContext.Provider>
  );
};