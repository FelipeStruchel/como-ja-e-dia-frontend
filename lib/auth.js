import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        api.me()
            .then((res) => {
                if (active) setUser(res.user || null);
            })
            .catch(() => {
                if (active) setUser(null);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    const login = async (email, password) => {
        const res = await api.login({ email, password });
        // Guarda token para sobrevivir a F5 mesmo se o cookie não for aceito
        if (typeof window !== "undefined" && res?.token) {
            window.localStorage.setItem("auth_token", res.token);
        }
        setUser(res.user || null);
        return res;
    };

    const logout = async () => {
        try {
            await api.logout();
        } catch (err) {
            // ignore
        }
        if (typeof window !== "undefined") {
            window.localStorage.removeItem("auth_token");
        }
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
