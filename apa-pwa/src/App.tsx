import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FeatureFlagProvider, useFlags } from './contexts/FeatureFlagContext';
import { HelmetProvider } from 'react-helmet-async';
import ProtectedRoute from './components/ProtectedRoute';
import FlaggedRoute from './components/FlaggedRoute';
import ScrollToTop from './components/ScrollToTop';
import LoginPage from './pages/LoginPage';
import DonationPage from './pages/DonationPage';
import VolunteerPage from './pages/VolunteerPage';
import HomePage from './pages/HomePage';
import AdoptionPage from './pages/AdoptionPage';
import PetDetailPage from './pages/PetDetailPage';
import RegisterPetPage from './pages/RegisterPetPage';
import LostPetsPage from './pages/LostPetsPage';
import NewsPage from './pages/NewsPage';
import PostDetailPage from './pages/PostDetailPage';
import ProfilePage from './pages/ProfilePage';
import LTPage from './pages/LTPage';
import DashboardPage from './pages/admin/DashboardPage';
import AdminApprovalPage from './pages/admin/AdminApprovalPage';
import PetManagementPage from './pages/admin/PetManagementPage';
import EditPetPage from './pages/admin/EditPetPage';
import PartnerManagementPage from './pages/admin/PartnerManagementPage';
import EditPartnerPage from './pages/admin/EditPartnerPage';
import PostManagementPage from './pages/admin/PostManagementPage';
import EditPostPage from './pages/admin/EditPostPage';
import LeadManagementPage from './pages/admin/LeadManagementPage';
import VolunteerManagementPage from './pages/admin/VolunteerManagementPage';
import LTManagementPage from './pages/admin/LTManagementPage';
import FlagsManagementPage from './pages/admin/FlagsManagementPage';
import GeneralSettingsPage from './pages/admin/GeneralSettingsPage';
import LostPetsManagementPage from './pages/admin/LostPetsManagementPage';
import RescuesPage from './pages/admin/RescuesPage';
import MedicalRecordPage from './pages/admin/MedicalRecordPage';
// ... (layouts omitidos...)
import {
  MessageSquare,
  LayoutDashboard,
  Users,
  Heart,
  Home,
  Newspaper,
  Settings,
  Landmark,
  Menu,
  Search,
  Ambulance,
  Stethoscope,
  User,
  X as CloseIcon,
  LogOut,
  CheckCircle2
} from 'lucide-react';

const AdminLayout = ({ children, title }: { children: React.ReactNode, title?: string }) => {
  const { signOut, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Admin - Desktop */}
      <aside className="w-60 bg-brand-green text-white hidden md:flex flex-col">
        <div className="p-8 flex justify-center border-b border-green-800">
          <img src="/logo.png" alt="Logo APA" className="h-20 w-auto invert brightness-0" />
        </div>

        <nav className="flex-grow p-4 space-y-1 overflow-y-auto scrollbar-hide">
          <AdminNavLinks />
        </nav>
        <SidebarFooter signOut={signOut} />
      </aside>

      {/* Sidebar Admin - Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Admin - Mobile Drawer */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-brand-green text-white z-[70] transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-green-800 flex justify-between items-center">
          <div className="flex justify-center w-full">
            <img src="/logo.png" alt="Logo APA" className="h-16 w-auto invert brightness-0" />
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="absolute right-4 p-2 hover:bg-green-700 rounded-full">
            <CloseIcon size={24} />
          </button>
        </div>

        <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
          <AdminNavLinks onClick={() => setIsSidebarOpen(false)} />
        </nav>
        <SidebarFooter signOut={signOut} />
      </aside>

      <main className="flex-grow flex flex-col min-w-0 h-screen overflow-hidden relative">
        {title && (
          <header className="bg-white border-b border-gray-100 p-3 md:p-4 flex justify-between items-center flex-shrink-0 z-50">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 text-gray-400 hover:text-brand-green"
              >
                <Menu size={24} />
              </button>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800 font-merriweather truncate">{title}</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-700">{user?.displayName || 'Admin'}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-brand-orange text-white flex items-center justify-center font-bold shadow-md">
                {user?.email?.[0].toUpperCase()}
              </div>
            </div>
          </header>
        )}
        <div className="flex-grow p-4 md:p-8 overflow-y-auto scrollbar-hide bg-gray-50">
          {children}
        </div>
      </main>
    </div>
  );
};

const AdminNavLinks = ({ onClick }: { onClick?: () => void }) => {
  const activeClass = "flex items-center space-x-3 p-3 rounded-xl bg-green-700/50 border-r-4 border-brand-orange transition font-bold";
  const inactiveClass = "flex items-center space-x-3 p-3 rounded-xl hover:bg-green-700 transition font-medium text-green-100";

  return (
    <>
      <NavLink to="/admin" end onClick={onClick} className={({ isActive }) => isActive ? activeClass : inactiveClass}>
        <LayoutDashboard size={20} />
        <span>Dashboard</span>
      </NavLink>
      <NavLink to="/admin/moderacao" onClick={onClick} className={({ isActive }) => isActive ? activeClass : inactiveClass}>
        <CheckCircle2 size={20} />
        <span>Moderação</span>
      </NavLink>
      <NavLink to="/admin/caes" onClick={onClick} className={({ isActive }) => isActive ? activeClass : inactiveClass}>
        <Heart size={20} />
        <span>Todos os Pets</span>
      </NavLink>
      <NavLink to="/admin/parceiros" onClick={onClick} className={({ isActive }) => isActive ? activeClass : inactiveClass}>
        <Users size={20} />
        <span>Parceiros</span>
      </NavLink>
      <NavLink to="/admin/noticias" onClick={onClick} className={({ isActive }) => isActive ? activeClass : inactiveClass}>
        <Newspaper size={20} />
        <span>Notícias</span>
      </NavLink>
      <NavLink to="/admin/leads" onClick={onClick} className={({ isActive }) => isActive ? activeClass : inactiveClass}>
        <MessageSquare size={20} />
        <span>Contatos de Adoção</span>
      </NavLink>
      <NavLink to="/admin/voluntarios" onClick={onClick} className={({ isActive }) => isActive ? activeClass : inactiveClass}>
        <Heart size={20} className="text-brand-orange" />
        <span>Voluntários</span>
      </NavLink>
      <NavLink to="/admin/lt" onClick={onClick} className={({ isActive }) => isActive ? activeClass : inactiveClass}>
        <Home size={20} className="text-brand-orange" />
        <span>Lares Temporários</span>
      </NavLink>
      <NavLink to="/admin/perdidos" onClick={onClick} className={({ isActive }) => isActive ? activeClass : inactiveClass}>
        <Search size={20} />
        <span>Mural de Perdidos</span>
      </NavLink>
      <NavLink to="/admin/resgates" onClick={onClick} className={({ isActive }) => isActive ? activeClass : inactiveClass}>
        <Ambulance size={20} />
        <span>Gestão de Resgates</span>
      </NavLink>
      <NavLink to="/admin/prontuarios" onClick={onClick} className={({ isActive }) => isActive ? activeClass : inactiveClass}>
        <Stethoscope size={20} />
        <span>Prontuários Médicos</span>
      </NavLink>
      <div className="pt-4 mt-4 border-t border-green-800">
        <p className="px-3 text-[10px] font-black text-green-300 uppercase tracking-widest mb-2">Sistema</p>
        <NavLink to="/admin/configuracoes" onClick={onClick} className={({ isActive }) => isActive ? activeClass : inactiveClass}>
          <Settings size={20} />
          <span>Configurações Vitais</span>
        </NavLink>
        <NavLink to="/admin/geral" onClick={onClick} className={({ isActive }) => isActive ? activeClass : inactiveClass}>
          <Landmark size={20} />
          <span>Dados e Doações</span>
        </NavLink>
      </div>
      <Link to="/" onClick={onClick} className="flex items-center space-x-3 p-3 mt-4 rounded-xl hover:bg-green-700 transition font-medium text-green-200">
        <Home size={20} />
        <span>Ver Site</span>
      </Link>
    </>
  );
};

const SidebarFooter = ({ signOut }: { signOut: () => void }) => (
  <div className="p-4 border-t border-green-800">
    <button
      onClick={() => signOut()}
      className="flex items-center space-x-3 p-3 w-full rounded-xl hover:bg-red-600 transition text-red-100 font-bold"
    >
      <LogOut size={20} />
      <span>Sair</span>
    </button>
  </div>
);

const Navigation = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const { flags } = useFlags();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <header className="bg-brand-green text-white p-3 md:p-4 shadow-lg sticky top-0 z-[100]">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center group">
          <img src="/logo.png" alt="Logo APA" className="h-12 md:h-20 w-auto invert brightness-0 group-hover:scale-105 transition-transform" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-8">
          <NavLink to="/" end className={({ isActive }) => isActive ? "text-brand-acqua transition font-bold text-sm uppercase tracking-widest border-b-2 border-brand-acqua pb-1" : "hover:text-brand-acqua transition font-bold text-sm uppercase tracking-widest"}>Home</NavLink>
          {flags.adoption && (
            <NavLink to="/adocao" className={({ isActive }) => isActive ? "text-brand-acqua transition font-bold text-sm uppercase tracking-widest border-b-2 border-brand-acqua pb-1" : "hover:text-brand-acqua transition font-bold text-sm uppercase tracking-widest"}>Adoção</NavLink>
          )}
          <div className="relative group">
            <button className="hover:text-brand-acqua transition font-bold text-sm uppercase tracking-widest flex items-center gap-1">
              Como Ajudar <Menu size={14} />
            </button>
            <div className="absolute top-full left-0 bg-brand-green border border-green-800 rounded-2xl shadow-2xl p-4 py-6 w-56 opacity-0 translate-y-2 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible transition-all z-[110] space-y-4">
              {flags.volunteers && (
                <NavLink to="/voluntariado" className={({ isActive }) => isActive ? "block text-brand-acqua transition font-bold text-xs uppercase tracking-widest border-b border-green-800/50 pb-3" : "block hover:text-brand-acqua transition font-bold text-xs uppercase tracking-widest border-b border-green-800/50 pb-3"}>Seja Voluntário</NavLink>
              )}
              <NavLink to="/lar-temporario" className={({ isActive }) => isActive ? "block text-brand-orange transition font-bold text-xs uppercase tracking-widest" : "block hover:text-brand-acqua transition font-bold text-xs uppercase tracking-widest text-brand-orange"}>Ser Lar Temporário</NavLink>
              <NavLink to="/doacoes" className={({ isActive }) => isActive ? "block text-brand-acqua transition font-bold text-xs uppercase tracking-widest" : "block hover:text-brand-acqua transition font-bold text-xs uppercase tracking-widest"}>Fazer Doação</NavLink>
            </div>
          </div>
          {flags.stories && (
            <NavLink to="/noticias" className={({ isActive }) => isActive ? "text-brand-acqua transition font-bold text-sm uppercase tracking-widest border-b-2 border-brand-acqua pb-1" : "hover:text-brand-acqua transition font-bold text-sm uppercase tracking-widest"}>Histórias</NavLink>
          )}
          <NavLink to="/perdidos" className={({ isActive }) => isActive ? "text-brand-acqua transition font-bold text-sm uppercase tracking-widest border-b-2 border-brand-acqua pb-1" : "hover:text-brand-acqua transition font-bold text-sm uppercase tracking-widest"}>Mural de Perdidos</NavLink>

          {user && (
            <NavLink to="/anunciar-pet" className={({ isActive }) => isActive ? "text-brand-orange transition font-bold text-sm uppercase tracking-widest border-b-2 border-brand-orange pb-1" : "hover:text-brand-orange transition font-bold text-sm uppercase tracking-widest"}>Anunciar Pet</NavLink>
          )}

          {loading ? (
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          ) : user ? (
            <div className="flex items-center space-x-4">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="bg-brand-orange text-white px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-900/20 hover:scale-105 transition-all flex items-center space-x-2"
                >
                  <LayoutDashboard size={14} />
                  <span>Painel</span>
                </Link>
              )}
              <NavLink
                to="/perfil"
                className={({ isActive }) => isActive ? "bg-white text-brand-green px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-md transition-all flex items-center space-x-2" : "text-xs font-black uppercase tracking-widest border border-white/20 px-4 py-2 rounded-xl hover:bg-white/10 transition flex items-center space-x-2"}
              >
                <User size={14} />
                <span>Perfil</span>
              </NavLink>
              <button
                onClick={() => signOut()}
                className="text-xs font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition flex items-center space-x-2"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="bg-brand-orange text-white px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-900/20 transition hover:scale-105 active:scale-95">Entrar</Link>
          )}
        </nav>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2 text-white hover:bg-white/10 rounded-full transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <CloseIcon size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu Tray (Bandeja) */}
      <div className={`fixed inset-0 bg-brand-green z-[90] transition-transform duration-500 ease-in-out md:hidden ${isMenuOpen ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex flex-col h-full justify-center items-center p-8 space-y-6">
          <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-xl font-bold font-merriweather hover:text-brand-acqua">Home</Link>
          {flags.adoption && (
            <Link to="/adocao" onClick={() => setIsMenuOpen(false)} className="text-xl font-bold font-merriweather hover:text-brand-acqua">Adoção</Link>
          )}
          {flags.donations && (
            <Link to="/doacoes" onClick={() => setIsMenuOpen(false)} className="text-xl font-bold font-merriweather hover:text-brand-acqua">Doações</Link>
          )}
          <Link to="/voluntariado" onClick={() => setIsMenuOpen(false)} className="text-xl font-bold font-merriweather hover:text-brand-acqua">Seja Voluntário</Link>
          <Link to="/lar-temporario" onClick={() => setIsMenuOpen(false)} className="text-xl font-bold font-merriweather text-brand-orange">Ser Lar Temporário</Link>
          {flags.stories && (
            <Link to="/noticias" onClick={() => setIsMenuOpen(false)} className="text-xl font-bold font-merriweather hover:text-brand-acqua">Histórias</Link>
          )}
          <Link to="/perdidos" onClick={() => setIsMenuOpen(false)} className="text-xl font-bold font-merriweather hover:text-brand-acqua">Mural de Perdidos</Link>

          <div className="pt-8 border-t border-white/10 w-full max-w-xs text-center space-y-4">
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="block bg-brand-orange text-white py-4 rounded-3xl font-black uppercase tracking-widest text-sm"
                  >
                    Acessar Painel
                  </Link>
                )}
                <button
                  onClick={() => { signOut(); setIsMenuOpen(false); }}
                  className="w-full py-4 border border-white/20 rounded-3xl font-black uppercase tracking-widest text-xs text-red-200"
                >
                  Sair da Conta
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="block bg-brand-orange text-white py-4 rounded-3xl font-black uppercase tracking-widest text-sm"
              >
                Acessar Minha Conta
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

function AppRoutes() {
  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route path="/" element={
        <div className="min-h-screen bg-white flex flex-col">
          <Navigation />
          <div className="flex-grow">
            <HomePage />
          </div>
          <footer className="bg-gray-50 p-12 border-t border-gray-100 mt-20">
            <div className="container mx-auto grid md:grid-cols-3 gap-12">
              <div>
                <h3 className="text-brand-green font-bold font-merriweather text-xl mb-4">APA Telêmaco Borba</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Protegendo e encontrando lares para cães desde 2025. Trabalho voluntário voltado ao bem-estar animal.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-4">Links Rápidos</h4>
                <div className="flex flex-col space-y-2 text-sm text-gray-500">
                  <Link to="/adocao" className="hover:text-brand-green transition">Nossos Cães</Link>
                  <Link to="/doacoes" className="hover:text-brand-green transition">Como Ajudar</Link>
                  <Link to="/voluntariado" className="hover:text-brand-green transition">Voluntariado</Link>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-4">Contato</h4>
                <p className="text-sm text-gray-500 italic">"Pela dignidade dos animais."</p>
                <div className="mt-4 text-xs font-bold text-brand-green">© 2026 SchCodes</div>
              </div>
            </div>
          </footer>
        </div>
      } />

      <Route path="/login" element={
        <div className="bg-gray-50 min-h-screen">
          <Navigation />
          <LoginPage />
        </div>
      } />

      <Route path="/adocao" element={
        <FlaggedRoute flag="adoption">
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navigation />
            <div className="flex-grow">
              <AdoptionPage />
            </div>
          </div>
        </FlaggedRoute>
      } />

      <Route path="/adocao/:id" element={
        <FlaggedRoute flag="adoption">
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navigation />
            <div className="flex-grow">
              <PetDetailPage />
            </div>
          </div>
        </FlaggedRoute>
      } />

      <Route path="/doacoes" element={
        <FlaggedRoute flag="donations">
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navigation />
            <div className="flex-grow">
              <DonationPage />
            </div>
          </div>
        </FlaggedRoute>
      } />
      <Route path="/lar-temporario" element={
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navigation />
          <div className="flex-grow">
            <LTPage />
          </div>
        </div>
      } />

      <Route path="/voluntariado" element={
        <FlaggedRoute flag="volunteers">
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navigation />
            <div className="flex-grow">
              <VolunteerPage />
            </div>
          </div>
        </FlaggedRoute>
      } />

      <Route path="/perdidos" element={
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navigation />
          <div className="flex-grow">
            <LostPetsPage />
          </div>
        </div>
      } />

      <Route path="/noticias/:id" element={
        <FlaggedRoute flag="stories">
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navigation />
            <div className="flex-grow">
              <PostDetailPage />
            </div>
          </div>
        </FlaggedRoute>
      } />

      <Route path="/noticias" element={
        <FlaggedRoute flag="stories">
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navigation />
            <div className="flex-grow">
              <NewsPage />
            </div>
          </div>
        </FlaggedRoute>
      } />

      {/* Rotas Privadas (Admin) */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute adminOnly>
            <AdminLayout title="Gerenciamento Administrativo">
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/moderacao" element={<AdminApprovalPage />} />
                <Route path="/caes" element={<PetManagementPage />} />
                <Route path="/caes/editar/:id" element={<EditPetPage />} />
                <Route path="/parceiros" element={<PartnerManagementPage />} />
                <Route path="/parceiros/novo" element={<EditPartnerPage />} />
                <Route path="/parceiros/editar/:id" element={<EditPartnerPage />} />
                <Route path="/noticias" element={<PostManagementPage />} />
                <Route path="/noticias/nova" element={<EditPostPage />} />
                <Route path="/noticias/editar/:id" element={<EditPostPage />} />
                <Route path="/leads" element={<LeadManagementPage />} />
                <Route path="/voluntarios" element={<VolunteerManagementPage />} />
                <Route path="/lt" element={<LTManagementPage />} />
                <Route path="/perdidos" element={<LostPetsManagementPage />} />
                <Route path="/resgates" element={<RescuesPage />} />
                <Route path="/prontuarios" element={<MedicalRecordPage />} />
                <Route path="/configuracoes" element={<FlagsManagementPage />} />
                <Route path="/geral" element={<GeneralSettingsPage />} />
              </Routes>
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/perfil" element={<ProtectedRoute><div className="min-h-screen bg-gray-50 flex flex-col"><Navigation /><div className="flex-grow"><ProfilePage /></div></div></ProtectedRoute>} />

      <Route path="/anunciar-pet" element={
        <ProtectedRoute>
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navigation />
            <div className="flex-grow">
              <RegisterPetPage />
            </div>
          </div>
        </ProtectedRoute>
      } />
    </Routes >
  );
}

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <FeatureFlagProvider>
          <Router>
            <ScrollToTop />
            <AppRoutes />
          </Router>
        </FeatureFlagProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
