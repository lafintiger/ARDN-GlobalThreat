import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import AdminPage from './pages/AdminPage.jsx'
import GMCheatSheet from './pages/GMCheatSheet.jsx'
import AIChatCheatSheet from './pages/AIChatCheatSheet.jsx'
import IntelDocuments from './pages/IntelDocuments.jsx'
import StudentScorecard from './pages/StudentScorecard.jsx'
import GMAnswerKey from './pages/GMAnswerKey.jsx'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/gm-cheatsheet" element={<GMCheatSheet />} />
        <Route path="/ai-chat-guide" element={<AIChatCheatSheet />} />
        <Route path="/intel" element={<IntelDocuments />} />
        <Route path="/scorecard" element={<StudentScorecard />} />
        <Route path="/answers" element={<GMAnswerKey />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
