import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Loading from '../components/Loading'; // Importe o componente de tela de carregamento
import '../styles/NewProject.css'; // Importe o CSS para estilizar a página
import config from '../config/Config';

const NewProject = () => {
  const navigate = useNavigate();
  const [projectData, setProjectData] = useState({
    title: '',
    description: '',
    technology: '',
    image: null, // Adicione o campo de imagem
  });
  const [loading, setLoading] = useState(false); // Estado para controlar a tela de carregamento
  const [isSidebarVisible, setIsSidebarVisible] = useState(() => {
    const savedPreference = sessionStorage.getItem('showSidebar');
    return savedPreference ? JSON.parse(savedPreference) : true;
  }); // Estado para visibilidade da sidebar

  useEffect(() => {
    const storedSidebarState = sessionStorage.getItem('showSidebar');
    if (storedSidebarState !== null) {
      setIsSidebarVisible(JSON.parse(storedSidebarState));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setProjectData({ ...projectData, image: files[0] });
    } else {
      setProjectData({ ...projectData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Mostrar tela de carregamento

    try {
      const user = JSON.parse(sessionStorage.getItem('user'));
      const userId = user ? user.id : null;

      if (!userId) {
        throw new Error('Usuário não está logado');
      }

      // Lógica para enviar os dados do projeto para o backend
      const response = await fetch(`${config.LocalApi}/projetos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'userId': userId,
        },
        body: JSON.stringify({
          titulo: projectData.title,
          descricao: projectData.description,
          tecnologia: projectData.technology,
        }),
      });

      const project = await response.json();
      const projectId = project.id;

      if (projectData.image) {
        const formData = new FormData();
        formData.append('file', projectData.image);

        await fetch(`${config.LocalApi}/projetos/${projectId}/uploadCapa`, {
          method: 'POST',
          body: formData,
        });
      }

      setLoading(false); // Ocultar tela de carregamento
      navigate('/projetos'); // Redireciona para a página de projetos após a criação
    } catch (error) {
      setLoading(false); // Ocultar tela de carregamento em caso de erro
      console.error('Erro ao criar projeto:', error);
      alert('Erro ao criar projeto. Tente novamente.');
    }
  };

  const toggleSidebar = () => {
    const newVisibility = !isSidebarVisible;
    setIsSidebarVisible(newVisibility);
    sessionStorage.setItem('showSidebar', JSON.stringify(newVisibility));
  };

  return (
    <div style={{ display: 'flex' }}>
      <div className="initial-top"></div>
      {isSidebarVisible && <Sidebar />}
      <div className="container" style={{ marginLeft: isSidebarVisible ? '350px' : '350px', transition: 'margin-left 0.3s' }}>
        <Header />
        <button onClick={toggleSidebar} className="toggle-sidebar-button">
          {isSidebarVisible ? <i className="fas fa-times"></i> : <i className="fas fa-bars"></i>}
        </button>
        {loading ? (
          <Loading />
        ) : (
          <div className="new-project-form">
            <h2>Criar Novo Projeto</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">Título do Projeto</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={projectData.title}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Descrição</label>
                <textarea
                  id="description"
                  name="description"
                  value={projectData.description}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="technology">Tecnologia</label>
                <input
                  type="text"
                  id="technology"
                  name="technology"
                  value={projectData.technology}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="image">Imagem do Projeto</label>
                <input
                  type="file"
                  id="image"
                  name="image"
                  accept="image/*"
                  onChange={handleChange}
                />
              </div>
              <button type="submit">Criar Projeto</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewProject;