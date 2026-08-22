import { Head, Link, router, usePage } from '@inertiajs/react'; // Added usePage
import { useState } from 'react';

export default function AdminUsers({ users }) {
    // Get errors from Inertia props
    const { errors } = usePage().props;

    // State for Modal and Form
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    // Handle form input changes
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    // Open modal to Add User
    const openCreateModal = () => {
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '', password_confirmation: '' });
        setShowModal(true);
    };

    // Open modal to Edit User
    const openEditModal = (user) => {
        setEditingUser(user);
        setFormData({ 
            name: user.name, 
            email: user.email, 
            password: '', 
            password_confirmation: '' 
        });
        setShowModal(true);
    };

    // Save data (Create or Update)
    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (editingUser) {
            // UPDATE USER
            router.put(`/admin/users/${editingUser.id}`, formData, {
                onSuccess: () => {
                    setShowModal(false);
                }
            });
        } else {
            // CREATE USER
            router.post('/admin/users', formData, {
                onSuccess: () => {
                    setShowModal(false);
                }
            });
        }
    };

    // Delete User
    const handleDelete = (id, email) => {
        if (email === 'admin@notracefi.test') {
            alert('Cannot delete the Super Admin!');
            return;
        }
        if (confirm('Are you sure you want to delete this user?')) {
            router.delete(`/admin/users/${id}`);
        }
    };

    return (
        <div className="min-h-screen bg-[#09090B] text-[#e5e1e4] p-8 pt-24">
            <Head title="Manage Users" />
            
            {/* Header & Add Button */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-[#c3c0ff]">Manage Users</h1>
                    <p className="text-gray-400 text-sm mt-1">Total User: {users.length}</p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={openCreateModal}
                        className="bg-[#4f46e5] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#4d44e3] transition-colors flex items-center gap-2 border border-[#c3c0ff]/20"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Add User
                    </button>
                    <Link 
                        href="/admin/dashboard"
                        className="text-[#c7c4d8] hover:text-white transition-colors flex items-center gap-1 bg-[#201f22] px-4 py-2 rounded-lg border border-white/10"
                    >
                        <span className="material-symbols-outlined">arrow_back</span> Back
                    </Link>
                </div>
            </div>

            {/* Users Data Table */}
            <div className="bg-[#18181B] rounded-xl border border-white/10 overflow-hidden shadow-lg">
                <table className="w-full text-left">
                    <thead className="bg-[#201f22] border-b border-white/10">
                        <tr>
                            <th className="p-4 text-xs font-mono text-gray-400">ID</th>
                            <th className="p-4 text-xs font-mono text-gray-400">Name</th>
                            <th className="p-4 text-xs font-mono text-gray-400">Email</th>
                            <th className="p-4 text-xs font-mono text-gray-400 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="p-4 font-mono text-xs">{user.id}</td>
                                <td className="p-4">{user.name}</td>
                                <td className="p-4">{user.email}</td>
                                <td className="p-4 flex justify-center gap-2">
                                    {user.email !== 'admin@notracefi.test' ? (
                                        <>
                                            {/* Edit Button */}
                                            <button 
                                                onClick={() => openEditModal(user)}
                                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 px-3 py-1 rounded text-xs transition-colors flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">edit</span>
                                                Edit
                                            </button>
                                            
                                            {/* Delete Button */}
                                            <button 
                                                onClick={() => handleDelete(user.id, user.email)}
                                                className="text-red-400 hover:text-red-300 hover:bg-red-400/10 px-3 py-1 rounded text-xs transition-colors flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">delete</span>
                                                Delete
                                            </button>
                                        </>
                                    ) : (
                                        <span className="text-green-400 text-xs font-bold bg-green-400/10 px-3 py-1 rounded-full">Super Admin</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL FORM (CREATE & UPDATE) --- */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#18181B] border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl relative">
                        <button 
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <h2 className="text-2xl font-bold text-[#c3c0ff] mb-6">
                            {editingUser ? 'Edit User' : 'Add New User'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Input Name */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Name</label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-[#09090B] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#c3c0ff] transition-colors"
                                    placeholder="Enter user name"
                                />
                                {errors.name && (
                                    <p className="text-red-400 text-xs mt-1">{errors.name}</p>
                                )}
                            </div>

                            {/* Input Email */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Email</label>
                                <input 
                                    type="email" 
                                    name="email" 
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-[#09090B] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#c3c0ff] transition-colors"
                                    placeholder="user@example.com"
                                />
                                {errors.email && (
                                    <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                                )}
                            </div>

                            {/* Input Password */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                    {editingUser ? 'New Password (Leave empty if unchanged)' : 'Password'}
                                </label>
                                <input 
                                    type="password" 
                                    name="password" 
                                    value={formData.password}
                                    onChange={handleChange}
                                    required={!editingUser}
                                    className="w-full bg-[#09090B] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#c3c0ff] transition-colors"
                                    placeholder="Minimum 8 characters"
                                />
                                {errors.password && (
                                    <p className="text-red-400 text-xs mt-1">{errors.password}</p>
                                )}
                            </div>

                            {/* Input Confirm Password */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Confirm Password</label>
                                <input 
                                    type="password" 
                                    name="password_confirmation" 
                                    value={formData.password_confirmation}
                                    onChange={handleChange}
                                    required={!editingUser}
                                    className="w-full bg-[#09090B] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#c3c0ff] transition-colors"
                                    placeholder="************"
                                />
                                {errors.password_confirmation && (
                                    <p className="text-red-400 text-xs mt-1">{errors.password_confirmation}</p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button 
                                type="submit"
                                className="w-full bg-[#4f46e5] hover:bg-[#4d44e3] text-white py-3 rounded-lg font-medium transition-colors mt-4"
                            >
                                {editingUser ? 'Update User' : 'Save New User'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}