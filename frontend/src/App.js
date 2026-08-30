import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import Posts from './pages/Posts';
import Calendar from './pages/Calendar';
import Comments from './pages/Comments';
import Leads from './pages/Leads';
import AIAgent from './pages/AIAgent';
import Accounts from './pages/Accounts';
import Layout from './components/Layout';

const queryClient = new QueryClient();

function App() {
  const isAuthenticated = localStorage.getItem('token');

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
            <Route index element={<Dashboard />} />
            <Route path="properties" element={<Properties />} />
            <Route path="posts" element={<Posts />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="comments" element={<Comments />} />
            <Route path="leads" element={<Leads />} />
            <Route path="ai-agent" element={<AIAgent />} />
            <Route path="accounts" element={<Accounts />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
