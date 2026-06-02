import Cookies from 'js-cookie';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

interface User {
  id: number;
  name: string;
  is_verified: boolean;
  role: 'user' | 'admin' | 'super_admin';
  email: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: (accessToken: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const storedToken = Cookies.get('accessToken');
    const storedUser = Cookies.get('user');

    if (storedToken && storedUser) {
      setAccessToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsAuthLoading(false);
  }, []);

  const login = (accessToken: string, user: User) => {
    setUser(user);
    setAccessToken(accessToken);

    Cookies.set('accessToken', accessToken, { expires: 7, sameSite: 'Strict' });
    Cookies.set('user', JSON.stringify(user), {
      expires: 7,
      sameSite: 'Strict',
    });
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);

    Cookies.remove('accessToken');
    Cookies.remove('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthLoading,
        isAuthenticated: !!accessToken,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
