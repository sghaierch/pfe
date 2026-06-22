import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import '../../../styles/SuperAdmin.css';

const SuperAdminLayout = () => (
  <div className="sa-wrapper">
    <Sidebar />
    <div className="sa-body">
      <Header />
      <main className="sa-main">
        <Outlet />
      </main>
    </div>
  </div>
);

export default SuperAdminLayout;
