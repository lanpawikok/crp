import { Head, Link } from '@inertiajs/react';

export default function AdminDashboard({ totalUsers }) {
    return (
        <div className="min-h-screen bg-[#09090B] text-[#e5e1e4] p-8 pt-24">
            <Head title="Admin Dashboard" />
            
            <h1 className="text-4xl font-bold text-[#c3c0ff] mb-6">Admin Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#18181B] p-6 rounded-xl border border-white/10">
                    <h3 className="text-gray-400 text-sm">Total Users</h3>
                    <p className="text-3xl font-bold mt-2">{totalUsers}</p>
                </div>
            </div>

            {/* TOMBOL KELOLA USER YANG KAMU MINTA */}
            <Link 
                href="/admin/users"
                className="inline-flex items-center gap-2 bg-[#4f46e5] text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-[#4d44e3] transition-colors border border-[#c3c0ff]/20 active:scale-95"
            >
                <span className="material-symbols-outlined">group</span>
                Kelola User
            </Link>
        </div>
    );
}