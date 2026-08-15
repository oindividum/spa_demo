// main component


import './App.css'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'


import Home from './pages/Home';
import PostPage from './pages/PostPage';

function App() {
   return (
 <BrowserRouter>
 <div className="min-h-screen bg-gray-50">
  <Routes>
    <Route path="/" element={<Home />} />
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
