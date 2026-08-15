// main component


import './App.css'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'


import HomeNew from './pages/HomeNew';
import PostPage from './pages/PostPage';

function App() {
   return (
 <BrowserRouter>
 <div className="min-h-screen bg-[#292B2F]">
  <Routes>
    <Route path="/" element={<HomeNew />} />
    <Route path="/index.html" element={<Navigate to="/" replace />} />
    <Route path="/index.html/" element={<Navigate to="/" replace />} />
    <Route path="/post/:id" element={<PostPage />} />
    <Route path="/index.html/post/:id" element={<PostPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
  </div>
 </BrowserRouter>
)}

export default App
