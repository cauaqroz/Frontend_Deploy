// src/context/ProjetosContext.js
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const ProjetosContext = createContext();

export const ProjetosProvider = ({ children }) => {
  const [projetos, setProjetos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjetos = async () => {
      try {
        const response = await axios.get('https://backend-conecta-09de4578e9de.herokuapp.com/projetos');
        setProjetos(response.data);
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

  const addProjeto = (novoProjeto) => {
    setProjetos((prevProjetos) => [...prevProjetos, novoProjeto]);
  };

  const updateProjeto = (projetoAtualizado) => {
    setProjetos((prevProjetos) =>
      prevProjetos.map((projeto) =>
        projeto.id === projetoAtualizado.id ? projetoAtualizado : projeto
      )
    );
  };

  return (
    <ProjetosContext.Provider value={{ projetos, loading, error, addProjeto, updateProjeto }}>
      {children}
    </ProjetosContext.Provider>
  );
};