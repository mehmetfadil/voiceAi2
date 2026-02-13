import React from 'react';
import Sidebar from './Sidebar';

const MainLayout = ({ children }) => {
    return (
        <div className="flex min-h-screen bg-dots bg-background-dark text-white">
            <Sidebar />
            <main className="flex-1 overflow-y-auto relative">
                {/* Opsiyonel: Header burada olabilir */}
                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default MainLayout;