import Dashboard from './pages/Dashboard';
import { PreferencesProvider } from './context/PreferencesContext';
import { ToastProvider } from './components/common/Toaster';

// Single-screen app: no router needed.
export default function App() {
  return (
    <PreferencesProvider>
      <ToastProvider>
        <Dashboard />
      </ToastProvider>
    </PreferencesProvider>
  );
}
