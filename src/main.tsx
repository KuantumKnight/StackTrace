import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ExperienceLayer } from './components/ExperienceLayer'
import './styles/human-polish.css'
import './styles/experience.css'
import './styles/build-workbench.css'
import './styles/build-cinematic.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <ExperienceLayer />
  </React.StrictMode>,
)
