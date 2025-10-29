import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Calendar, LogOut, User, Shield } from 'lucide-react';

const Navbar = ({ user, onLogout }) => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

const navItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/asistencia', icon: Users, label: 'Asistencia' },
  { path: '/calendario', icon: Calendar, label: 'Calendario' },
  ...(user?.is_admin ? [
    { path: '/profesoras', icon: Shield, label: 'Facilitadoras' },
    { path: '/aprendices', icon: Users, label: 'Aprendices' }
  ] : [])
];
  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo y título */}
          <div className="flex items-center space-x-4">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <User className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">TecnoAcademia</h1>
              <p className="text-sm text-gray-600">Sistema de Asistencia</p>
            </div>
          </div>

          {/* Navegación principal */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Información del usuario y logout */}
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user.nombre}</p>
              <p className="text-xs text-gray-600">{user.especialidad}</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 bg-red-100 text-red-700 px-3 py-2 rounded-md hover:bg-red-200 transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>

        {/* Navegación móvil */}
        <div className="md:hidden border-t">
          <div className="flex justify-around py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center py-2 px-3 rounded-md text-xs ${
                    isActive(item.path)
                      ? 'text-indigo-700 bg-indigo-50'
                      : 'text-gray-600'
                  }`}
                >
                  <Icon size={20} />
                  <span className="mt-1">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;