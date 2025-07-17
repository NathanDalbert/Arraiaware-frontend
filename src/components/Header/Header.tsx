import { useEffect, useState } from "react";
import { Bell, User, UserIcon, X, LogOut,KeyRound } from "lucide-react";
import { useNavigate, NavLink } from "react-router-dom";

import logo from "../../../imagens/logo_arraiware.png";
import NotificationMessages from "../NotificationMessages/NotificationMessages";
import ChangePasswordForm from "../ChangePasswordForm/ChangePasswordForm";

interface UserProfile {
  name: string;
  email?: string;
  avatarUrl?: string;
  userType: "ADMIN" | "RH" | "GESTOR" | "COLABORADOR" | "COMITE";
}

type NotificationState = {
  status: 'success' | 'error';
  title: string;
  message: string;
} | null;

export default function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [notification, setNotification] = useState<NotificationState>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (!showConfig) {
      setShowPasswordForm(false);
    }
  }, [showConfig]);

  function handleLogout() {
    localStorage.clear();
    setShowConfig(false);
    navigate("/login");
  }

  const linkClass = (isActive: boolean) =>
    `px-2 py-1 rounded font-medium transition-colors ${
      isActive ? "text-orange-500" : "text-gray-900 hover:text-orange-500"
    }`;

  return (
    <>
      {/* O componente de notificação é renderizado condicionalmente aqui */}
      {notification && (
        <NotificationMessages
          status={notification.status}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <header className="fixed inset-x-0 top-0 bg-slate-50 shadow-md z-50">
        <div className="w-full flex items-center justify-between px-6 py-4">
          {/* LOGO + NAVEGAÇÃO */}
          <div className="flex items-center space-x-8">
            <div
              className="flex items-center space-x-4 cursor-pointer"
              onClick={() => navigate("/home")}
            >
              <img src={logo} alt="ArraiaWare logo" className="h-10 w-auto" />
              <span className="text-2xl font-semibold text-gray-800">
                ArraiaWare
              </span>
            </div>
            <nav>
              <ul className="flex space-x-6">
                <li><NavLink to="/home" className={({ isActive }) => linkClass(isActive)}>Home</NavLink></li>
                <li><NavLink to="/avaliacao/comportamento" className={({ isActive }) => linkClass(isActive)}>Avaliação</NavLink></li>
                <li><NavLink to="/dashboard" className={({ isActive }) => linkClass(isActive)}>Dashboard</NavLink></li>
                <li><NavLink to="/avaliacao/growth" className={({ isActive }) => linkClass(isActive)}>Metas</NavLink></li>
                {(user?.userType === "RH" || user?.userType === "ADMIN") && (
                  <li><NavLink to="/rh" className={({ isActive }) => linkClass(isActive)}>Painel RH</NavLink></li>
                )}
                {(user?.userType === "GESTOR" || user?.userType === "ADMIN") && (
                  <li><NavLink to="/gestor" className={({ isActive }) => linkClass(isActive)}>Painel Gestor</NavLink></li>
                )}
                {(user?.userType === "COMITE" || user?.userType === "ADMIN") && (
                  <li><NavLink to="/comite" className={({ isActive }) => linkClass(isActive)}>Painel Comitê</NavLink></li>
                )}
                {user?.userType === "ADMIN" && (
                  <li><NavLink to="/admin" className={({ isActive }) => linkClass(isActive)}>Painel Admin</NavLink></li>
                )}
              </ul>
            </nav>
          </div>

          {/* ÍCONES + PERFIL */}
          <div className="flex items-center space-x-6">
            <Bell className="h-6 w-6 text-gray-600 hover:text-orange-500 cursor-pointer" onClick={() => alert("Você clicou nas notificações!")} />
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setShowConfig(true)}>
              <div className="p-1 bg-slate-100 rounded-full">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <span className="text-gray-800 font-medium">
                {user?.name || "Usuário"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] transition-opacity duration-300 bg-black/30 ${showConfig ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setShowConfig(false)}
      />

      {/* Sidebar de Configurações */}
      <aside className={`fixed right-0 top-0 h-full w-80 bg-white shadow-lg z-[70] p-6 flex flex-col transform transition-transform duration-300 ease-in-out ${showConfig ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Configurações</h2>
          <X className="h-6 w-6 cursor-pointer text-gray-600" onClick={() => setShowConfig(false)} />
        </div>
        {user && (
          <div className="flex flex-col items-center mb-6 text-center border-b border-gray-200 pb-6">
            {user.avatarUrl ? (<img src={user.avatarUrl} alt="Avatar do usuário" className="h-16 w-16 rounded-full object-cover mb-2" />) : (<div className="p-4 bg-slate-100 rounded-full mb-2"><UserIcon className="h-8 w-8 text-gray-600" /></div>)}
            <p className="text-gray-800 font-medium">{user.name}</p>
            {user.email && <p className="text-sm text-gray-500 truncate w-full">{user.email}</p>}
          </div>
        )}
        <div className="flex-grow">
          {showPasswordForm ? (
            <ChangePasswordForm 
              onUpdate={setNotification}
              onClose={() => setShowConfig(false)}
              onBack={() => setShowPasswordForm(false)}
            />
          ) : (
            <button onClick={() => setShowPasswordForm(true)} className="w-full bg-orange-500 text-white p-2 rounded-md hover:bg-orange-600 transition flex items-center justify-center gap-2">
              <KeyRound size={18} />
              Alterar Senha
            </button>
          )}
        </div>
        <button onClick={handleLogout} aria-label="Logout" className="mt-auto w-full bg-red-500 text-white p-3 rounded-md hover:bg-red-600 transition flex items-center justify-center gap-2">
          <LogOut className="h-5 w-5" />
          Sair da Conta
        </button>
      </aside>
    </>
  );
}