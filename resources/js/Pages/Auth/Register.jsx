import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        terms: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post('/register', {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Register" />

            <div className="min-h-screen bg-[#09090B] text-[#e5e1e4] flex flex-col relative overflow-x-hidden">

                {/* Background */}
                <div
                    className="fixed inset-0 pointer-events-none z-0"
                    style={{
                        backgroundImage: `
                            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
                        `,
                        backgroundSize: '32px 32px',
                    }}
                />

                <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-400/10 rounded-full blur-[120px] pointer-events-none z-0" />

                <div className="fixed bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none z-0" />

                {/* Main */}
                <main className="flex-grow flex items-center justify-center relative z-10 px-5 md:px-10 py-24">

                    <div className="w-full max-w-md bg-[#18181B]/40 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl relative overflow-hidden">

                        {/* Glow */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-300/50 to-transparent" />

                        <div className="p-8 md:p-10 flex flex-col gap-8">

                            {/* Header */}
                            <div className="text-center flex flex-col gap-2">

                                <h1 className="text-3xl md:text-4xl font-bold">
                                    Join No Trace
                                </h1>

                                <p className="text-sm text-gray-400">
                                    Initialize your Web3 Hub account.
                                </p>

                            </div>

                            {/* Register Form */}
                            <form
                                onSubmit={submit}
                                className="flex flex-col gap-5"
                            >

                                {/* Name */}
                                <div className="flex flex-col gap-2">

                                    <label
                                        htmlFor="name"
                                        className="text-xs font-medium text-gray-400 uppercase tracking-wider"
                                    >
                                        Name
                                    </label>

                                    <input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData('name', e.target.value)
                                        }
                                        placeholder="Your name"
                                        required
                                        className="bg-[#09090B] border border-white/10 text-white rounded-lg px-4 py-3 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 transition"
                                    />

                                    {errors.name && (
                                        <p className="text-red-400 text-sm">
                                            {errors.name}
                                        </p>
                                    )}

                                </div>

                                {/* Email */}
                                <div className="flex flex-col gap-2">

                                    <label
                                        htmlFor="email"
                                        className="text-xs font-medium text-gray-400 uppercase tracking-wider"
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
                                        placeholder="pilot@notrace.xyz"
                                        required
                                        autoComplete="username"
                                        className="bg-[#09090B] border border-white/10 text-white rounded-lg px-4 py-3 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 transition"
                                    />

                                    {errors.email && (
                                        <p className="text-red-400 text-sm">
                                            {errors.email}
                                        </p>
                                    )}

                                </div>

                                {/* Password */}
                                <div className="flex flex-col gap-2">

                                    <label
                                        htmlFor="password"
                                        className="text-xs font-medium text-gray-400 uppercase tracking-wider"
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
                                        placeholder="••••••••"
                                        required
                                        autoComplete="new-password"
                                        className="bg-[#09090B] border border-white/10 text-white rounded-lg px-4 py-3 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 transition"
                                    />

                                    {errors.password && (
                                        <p className="text-red-400 text-sm">
                                            {errors.password}
                                        </p>
                                    )}

                                </div>

                                {/* Confirm Password */}
                                <div className="flex flex-col gap-2">

                                    <label
                                        htmlFor="password_confirmation"
                                        className="text-xs font-medium text-gray-400 uppercase tracking-wider"
                                    >
                                        Confirm Password
                                    </label>

                                    <input
                                        id="password_confirmation"
                                        type="password"
                                        value={data.password_confirmation}
                                        onChange={(e) =>
                                            setData(
                                                'password_confirmation',
                                                e.target.value
                                            )
                                        }
                                        placeholder="••••••••"
                                        required
                                        autoComplete="new-password"
                                        className="bg-[#09090B] border border-white/10 text-white rounded-lg px-4 py-3 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 transition"
                                    />

                                    {errors.password_confirmation && (
                                        <p className="text-red-400 text-sm">
                                            {errors.password_confirmation}
                                        </p>
                                    )}

                                </div>

                                {/* Terms */}
                                <div className="flex items-start gap-3 mt-2">

                                    <input
                                        id="terms"
                                        type="checkbox"
                                        checked={data.terms}
                                        onChange={(e) =>
                                            setData(
                                                'terms',
                                                e.target.checked
                                            )
                                        }
                                        className="mt-1 w-4 h-4 accent-indigo-300"
                                    />

                                    <label
                                        htmlFor="terms"
                                        className="text-sm text-gray-400"
                                    >
                                        I agree to the{' '}

                                        <a
                                            href="#"
                                            className="text-indigo-300 hover:text-indigo-200 transition"
                                        >
                                            Terms of Service
                                        </a>

                                        {' '}and{' '}

                                        <a
                                            href="#"
                                            className="text-indigo-300 hover:text-indigo-200 transition"
                                        >
                                            Privacy Policy
                                        </a>

                                    </label>

                                </div>

                                {/* Register Button */}
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg py-3 mt-4 transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processing
                                        ? 'Creating Account...'
                                        : 'Register Account'}
                                </button>

                            </form>

                            {/* Divider */}
                            <div className="flex items-center gap-4">

                                <div className="flex-grow h-px bg-white/10" />

                                <span className="text-xs text-gray-500 uppercase tracking-widest">
                                    Or
                                </span>

                                <div className="flex-grow h-px bg-white/10" />

                            </div>

                            {/* Wallet */}
                            <button
                                type="button"
                                className="w-full flex items-center justify-center gap-3 border border-white/10 bg-[#18181B] hover:bg-[#2a2a2c] rounded-lg py-3 transition"
                            >
                                <span className="text-indigo-300">
                                    ◈
                                </span>

                                <span className="font-semibold">
                                    Connect Wallet
                                </span>
                            </button>

                            {/* Login Link */}
                            <div className="text-center mt-2">

                                <p className="text-sm text-gray-400">

                                    Already initialized?{' '}

                                    <Link
                                        href="/login"
                                        className="text-indigo-300 hover:text-indigo-200 font-bold transition"
                                    >
                                        Log In here
                                    </Link>

                                </p>

                            </div>

                        </div>

                    </div>

                </main>

                {/* Footer */}
                <footer className="bg-[#131315] border-t border-white/10 w-full py-8 mt-auto relative z-10">

                    <div className="flex flex-col md:flex-row justify-between items-center px-5 md:px-10 max-w-7xl mx-auto gap-4">

                        <div className="text-lg font-semibold">
                            No Trace
                        </div>

                        <div className="flex gap-6 text-xs">

                            <a
                                href="#"
                                className="text-gray-400 hover:text-indigo-300 transition"
                            >
                                Privacy Policy
                            </a>

                            <a
                                href="#"
                                className="text-gray-400 hover:text-indigo-300 transition"
                            >
                                Terms of Service
                            </a>

                            <a
                                href="#"
                                className="text-gray-400 hover:text-indigo-300 transition"
                            >
                                Docs
                            </a>

                            <a
                                href="#"
                                className="text-gray-400 hover:text-indigo-300 transition"
                            >
                                Github
                            </a>

                        </div>

                        <div className="text-xs text-gray-500">
                            © 2026 No Trace Web3 Hub
                        </div>

                    </div>

                </footer>

            </div>
        </>
    );
}