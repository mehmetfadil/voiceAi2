import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ArrowRight, Terminal, Globe, Mail } from 'lucide-react';
import { cn } from '../utils/cn';
import Button from '../components/common/Button';
import axios from 'axios';

const Login = () => {
    const [activeTab, setActiveTab] = useState('login');
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

        try {
            let response;
            if (activeTab === 'signup') {
                response = await axios.post(`${apiBaseUrl}/register`, {
                    email: formData.email,
                    password: formData.password,
                    full_name: formData.fullName
                });
                // Kayıt başarılı olunca otomatik giriş sekmesine geçebilir veya direkt giriş yapabiliriz
                // Kullanıcı deneyimi için login sekmesine atıyoruz:
                setActiveTab('login');
                setError('Registration successful! Please login.');
                setLoading(false); // Login işlemine devam etmediğimiz için loading kapat
                return;
            } else {
                response = await axios.post(`${apiBaseUrl}/token`, {
                    email: formData.email,
                    password: formData.password
                });

                const { access_token } = response.data;
                localStorage.setItem('token', access_token);
                navigate('/');
            }

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Authentication failed.');
        } finally {
            if (activeTab !== 'signup') setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background-dark text-white flex flex-col items-center justify-center relative overflow-hidden font-mono">
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#f2f20d05_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#f2f20d05_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                <div className="absolute inset-0 bg-radial-gradient from-primary/5 via-transparent to-transparent opacity-50"></div>
            </div>

            <div className="relative z-10 w-full max-w-md px-4">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center mb-4 relative group cursor-pointer">
                        <div className="w-16 h-16 border-2 border-primary bg-background-dark flex items-center justify-center shadow-[0_0_15px_rgba(242,242,13,0.2)] group-hover:shadow-[0_0_25px_rgba(242,242,13,0.4)] transition-all duration-300">
                            <Terminal className="text-primary w-8 h-8" />
                            <div className="absolute -top-1 -left-1 w-2 h-2 bg-primary"></div>
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary"></div>
                            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary"></div>
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary"></div>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight uppercase">
                        Voice<span className="text-primary">AI</span>
                    </h1>
                    <p className="text-xs text-primary/60 tracking-[0.2em] uppercase mt-2">
                        System Access v2.0
                    </p>
                </div>

                <div className="bg-background-surface/80 backdrop-blur-md border border-white/10 relative shadow-2xl">
                    <div className="absolute -top-1 -left-1 w-1 h-1 bg-white"></div>
                    <div className="absolute -top-1 -right-1 w-1 h-1 bg-white"></div>
                    <div className="absolute -bottom-1 -left-1 w-1 h-1 bg-white"></div>
                    <div className="absolute -bottom-1 -right-1 w-1 h-1 bg-white"></div>

                    <div className="grid grid-cols-2 border-b border-white/10">
                        <button
                            onClick={() => setActiveTab('login')}
                            className={cn(
                                "py-4 text-sm font-bold uppercase tracking-wider transition-colors duration-200 border-b-2",
                                activeTab === 'login' ? "text-primary border-primary bg-primary/5" : "text-gray-500 border-transparent hover:text-white hover:bg-white/5"
                            )}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => setActiveTab('signup')}
                            className={cn(
                                "py-4 text-sm font-bold uppercase tracking-wider transition-colors duration-200 border-b-2",
                                activeTab === 'signup' ? "text-primary border-primary bg-primary/5" : "text-gray-500 border-transparent hover:text-white hover:bg-white/5"
                            )}
                        >
                            Sign Up
                        </button>
                    </div>

                    <div className="p-8">
                        <div className="text-center mb-6">
                            <p className="text-xs text-gray-400 uppercase tracking-widest">
                                {activeTab === 'login' ? 'Initialize session to continue' : 'Create new operator identity'}
                            </p>
                        </div>

                        {error && (
                            <div className={cn(
                                "mb-4 p-3 border text-xs font-mono text-center",
                                error.includes('successful') ? "bg-green-500/10 border-green-500/50 text-green-500" : "bg-red-500/10 border-red-500/50 text-red-500"
                            )}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleAuth} className="space-y-6">
                            {activeTab === 'signup' && (
                                <div className="group relative">
                                    <div className="absolute top-0 left-0 h-full w-12 flex items-center justify-center text-gray-500 border-r border-white/10 group-focus-within:text-primary transition-colors">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="Full Name"
                                        className="w-full bg-background-dark/50 border border-white/20 text-white placeholder-gray-600 pl-16 pr-4 py-3 focus:outline-none focus:border-primary focus:bg-primary/5 transition-all text-sm font-mono"
                                        required
                                    />
                                </div>
                            )}

                            <div className="group relative">
                                <div className="absolute top-0 left-0 h-full w-12 flex items-center justify-center text-gray-500 border-r border-white/10 group-focus-within:text-primary transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter Email"
                                    className="w-full bg-background-dark/50 border border-white/20 text-white placeholder-gray-600 pl-16 pr-4 py-3 focus:outline-none focus:border-primary focus:bg-primary/5 transition-all text-sm font-mono"
                                    required
                                />
                            </div>

                            <div className="group relative">
                                <div className="absolute top-0 left-0 h-full w-12 flex items-center justify-center text-gray-500 border-r border-white/10 group-focus-within:text-primary transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter Password"
                                    className="w-full bg-background-dark/50 border border-white/20 text-white placeholder-gray-600 pl-16 pr-4 py-3 focus:outline-none focus:border-primary focus:bg-primary/5 transition-all text-sm font-mono"
                                    required
                                />
                            </div>

                            <Button className="w-full group overflow-hidden" type="submit" disabled={loading}>
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {loading ? 'PROCESSING...' : (activeTab === 'login' ? 'Execute Protocol' : 'Register Identity')}
                                    {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                                </span>
                                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-100"></div>
                            </Button>
                        </form>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                                <span className="bg-background-surface px-2 text-gray-500">Or authenticate via</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button className="flex items-center justify-center px-4 py-2 border border-white/10 hover:border-white/30 hover:bg-white/5 transition-colors group">
                                <Globe size={16} className="text-gray-500 group-hover:text-white mr-2 transition-colors" />
                                <span className="text-xs text-gray-400 group-hover:text-white uppercase font-bold tracking-wider">Google</span>
                            </button>
                            <button className="flex items-center justify-center px-4 py-2 border border-white/10 hover:border-white/30 hover:bg-white/5 transition-colors group">
                                <Globe size={16} className="text-gray-500 group-hover:text-white mr-2 transition-colors" />
                                <span className="text-xs text-gray-400 group-hover:text-white uppercase font-bold tracking-wider">Microsoft</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-black/40 border-t border-white/10 px-8 py-3 flex justify-between items-center text-[10px] uppercase tracking-wider text-gray-500 font-mono">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                            System Online
                        </div>
                        <div>SECURE::TLS_1.3</div>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest font-mono">
                        © 2024 VoiceAI Corp. <a href="#" className="hover:text-primary ml-2 underline decoration-dotted">Privacy</a> <span className="mx-1">::</span> <a href="#" className="hover:text-primary underline decoration-dotted">Terms</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;