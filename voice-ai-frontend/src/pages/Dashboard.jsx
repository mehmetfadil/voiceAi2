import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import PixelCard from '../components/common/PixelCard';
import Button from '../components/common/Button';
import { Activity, Cpu, Users, Zap } from 'lucide-react';

const StatCard = ({ label, value, subtext, icon: Icon }) => (
    <div className="flex items-center justify-between">
        <div>
            <p className="text-gray-400 text-xs font-mono uppercase mb-1">{label}</p>
            <h4 className="text-2xl font-bold text-white">{value}</h4>
            <p className="text-xs text-primary mt-1">{subtext}</p>
        </div>
        <div className="p-3 bg-white/5 rounded border border-white/10">
            <Icon className="text-primary" size={24} />
        </div>
    </div>
);

const Dashboard = () => {
    return (
        <MainLayout>
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold uppercase tracking-wide">
                        Dashboard <span className="text-primary">//</span> Overview
                    </h1>
                    <p className="text-gray-400 mt-2 font-mono">Welcome back, Operator_01. System is operational.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost">View Logs</Button>
                    <Button>+ Deploy Agent</Button>
                </div>
            </header>

            {/* İstatistik Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <PixelCard>
                    <StatCard label="Active Agents" value="12" subtext="+2 spinning up" icon={Users} />
                </PixelCard>
                <PixelCard>
                    <StatCard label="Total Requests" value="8,432" subtext="Last 24h" icon={Activity} />
                </PixelCard>
                <PixelCard>
                    <StatCard label="System Load" value="42%" subtext="Optimal Range" icon={Cpu} />
                </PixelCard>
                <PixelCard>
                    <StatCard label="Avg Latency" value="124ms" subtext="-15ms vs yesterday" icon={Zap} />
                </PixelCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Ana İçerik Alanı */}
                <div className="lg:col-span-2 space-y-6">
                    <PixelCard title="Recent Activity">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/10 text-gray-500 text-xs font-mono uppercase">
                                        <th className="pb-3 font-normal">Status</th>
                                        <th className="pb-3 font-normal">Agent ID</th>
                                        <th className="pb-3 font-normal">Type</th>
                                        <th className="pb-3 font-normal text-right">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm">
                                    {[1, 2, 3, 4].map((i) => (
                                        <tr key={i} className="group hover:bg-white/5 transition-colors">
                                            <td className="py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${i === 2 ? 'bg-primary animate-pulse' : 'bg-green-500'}`}></div>
                                                    <span className={i === 2 ? 'text-primary' : 'text-green-500'}>
                                                        {i === 2 ? 'PROCESSING' : 'COMPLETED'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 font-mono text-gray-300">#AG-882{i}</td>
                                            <td className="py-4 text-gray-400">Inbound Call</td>
                                            <td className="py-4 text-right font-mono text-gray-500">10:4{i} AM</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </PixelCard>
                </div>

                {/* Yan Panel: Sistem Sağlığı */}
                <div className="space-y-6">
                    <PixelCard title="Server Nodes" variant="primary">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-black font-bold">LLM Engine (DeepSeek)</span>
                                <span className="px-2 py-0.5 bg-black/10 text-black text-xs font-mono font-bold rounded">ONLINE</span>
                            </div>
                            <div className="w-full bg-black/10 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-black h-full w-[85%]"></div>
                            </div>

                            <div className="flex justify-between items-center text-sm mt-4">
                                <span className="text-black/70">TTS Service (Google)</span>
                                <span className="px-2 py-0.5 bg-black/10 text-black text-xs font-mono font-bold rounded">BUSY</span>
                            </div>
                            <div className="w-full bg-black/10 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-black h-full w-[45%] animate-pulse"></div>
                            </div>
                        </div>
                    </PixelCard>

                    <div className="p-6 border border-white/10 bg-gradient-to-br from-background-surface to-transparent rounded">
                        <h4 className="text-lg font-bold mb-2">System Update</h4>
                        <p className="text-gray-400 text-sm mb-4">
                            New voice models are available for deployment.
                        </p>
                        <Button variant="outline" className="w-full text-xs">Read Changelog</Button>
                    </div>
                </div>

            </div>
        </MainLayout>
    );
};

export default Dashboard;