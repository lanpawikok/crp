import { Link, Head, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';

export default function Login({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'));
    };

    return (
        <>
            <Head title="Login" />

            <div className="min-h-screen bg-[#131315] text-[#e5e1e4] flex flex-col relative overflow-hidden">

                {/* Navbar */}
                <nav className="bg-[#18181B]/80 backdrop-blur-xl fixed top-0 w-full z-50 border-b border-white/10">
                    <div className="flex justify-between items-center h-16 px-6 md:px-10 max-w-7xl mx-auto">

                        <div className="flex items-center gap-2">
                            <span className="text-[#c3c0ff] text-xl">
                                ◆
                            </span>

                            <span className="text-xl font-bold tracking-tight text-[#c3c0ff]">
                                Utilify
                            </span>
                        </div>

                        <button
                            type="button"
                            className="bg-indigo-600 text-white px-5 py-2 rounded-md text-sm hover:opacity-90 transition"
                        >
                            Connect Wallet
                        </button>

                    </div>
                </nav>

                {/* Background Blur */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px]" />

                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />

                {/* Main */}
                <main className="flex-grow flex items-center justify-center pt-24 pb-16 px-4 relative z-10">

                    <div className="w-full max-w-md p-8 rounded-xl bg-[#18181B]/70 backdrop-blur-xl border border-white/10 shadow-2xl">

                        {/* Header */}
                        <div className="text-center mb-8">

                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#2a2a2c] border border-white/10 mb-4">
                                <span className="text-[#c3c0ff] text-xl">
                                    ◈
                                </span>
                            </div>

                            <h1 className="text-3xl font-bold">
                                Welcome Back
                            </h1>

                            <p className="text-gray-400 mt-2">
                                Login to access the Web3 hub.
                            </p>

                        </div>

                        {/* Status */}
                        {status && (
                            <div className="mb-4 text-sm text-green-400 text-center">
                                {status}
                            </div>
                        )}

                        {/* Wallet Buttons */}
                        <div className="space-y-3 mb-6">


                            <button
                                type="button"
                                className="w-full text-left p-4 rounded-lg bg-[#1c1b1d] border border-white/10 hover:bg-[#2a2a2c] transition"
                            >
                                🦊 MetaMask
                            </button>

                            <button
                                type="button"
                                className="w-full text-left p-4 rounded-lg bg-[#1c1b1d] border border-white/10 hover:bg-[#2a2a2c] transition"
                            >
                                🔗 WalletConnect
                            </button>

                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-4 my-6">

                            <div className="flex-grow h-px bg-white/10" />

                            <span className="text-xs text-gray-500 uppercase">
                                or
                            </span>

                            <div className="flex-grow h-px bg-white/10" />

                        </div>

                        {/* Laravel Login */}
                        <form onSubmit={submit} className="space-y-4">

                            {/* Email */}
                            <div>

                                <label
                                    htmlFor="email"
                                    className="text-sm text-gray-400 block mb-2"
                                >
                                    Email Address
                                </label>

                                <input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                    placeholder="you@example.com"
                                    className="w-full bg-[#131315] border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-indigo-400"
                                />

                                {errors.email && (
                                    <p className="text-red-400 text-sm mt-2">
                                        {errors.email}
                                    </p>
                                )}

                            </div>

                            {/* Password */}
                            <div>

                                <label
                                    htmlFor="password"
                                    className="text-sm text-gray-400 block mb-2"
                                >
                                    Password
                                </label>

                                <input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                    placeholder="Enter your password"
                                    className="w-full bg-[#131315] border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-indigo-400"
                                />

                                {errors.password && (
                                    <p className="text-red-400 text-sm mt-2">
                                        {errors.password}
                                    </p>
                                )}

                            </div>

                            {/* Remember */}
                            <label className="flex items-center gap-2 text-sm text-gray-400">

                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) =>
                                        setData(
                                            'remember',
                                            e.target.checked
                                        )
                                    }
                                />

                                Remember me

                            </label>

                            {/* Login Button */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full border border-indigo-400 text-indigo-300 hover:bg-indigo-500 hover:text-white py-3 rounded-lg transition disabled:opacity-50"
                            >
                                {processing
                                    ? 'Logging in...'
                                    : 'Continue with Email'}
                            </button>
                            <div className="text-center mt-2">

                                <p className="text-sm text-gray-400">

                                    Didn't have an account  ?{' '}

                                    <Link
                                        href="register"
                                        className="text-indigo-300 hover:text-indigo-200 font-bold transition"
                                    >
                                        Register Here
                                    </Link>

                                </p>

                            </div>


                        </form>

                    </div>

                </main>

                {/* Footer */}
                <footer className="border-t border-white/10 py-6 text-center text-sm text-gray-500 relative z-10">
                    © 2026 Utilify Web3 Hub
                </footer>

            </div>
        </>
    );
}