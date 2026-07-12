import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loginSchema } from '../validation/authValidation';
import { loginUser, clearError } from '../store/authSlice';
import { Chrome } from 'lucide-react';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    dispatch(clearError());
    const resultAction = await dispatch(loginUser(data));
    
    if (loginUser.fulfilled.match(resultAction)) {
      toast.success('Welcome back to AssetFlow!');
      navigate('/dashboard', { replace: true });
    } else {
      toast.error(resultAction.payload || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-slate-950 flex flex-col md:flex-row transition-all duration-300">
      
      {/* Left side: Minimalist login form */}
      <div className="flex-1 p-8 sm:p-12 md:p-16 lg:p-24 flex flex-col justify-between bg-white dark:bg-slate-950">
        
        {/* Header Branding */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-md bg-slate-950 dark:bg-white flex items-center justify-center text-white dark:text-slate-950 font-bold text-lg">
              A
            </span>
            <span className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
              AssetFlow
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-950 dark:text-white uppercase tracking-widest bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-md">
            Portal
          </span>
        </div>

        {/* Form Body */}
        <div className="my-auto py-12 max-w-md w-full mx-auto">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white mb-2">
            Login to Your Account
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            Access your assets, resource bookings, and active workspaces.
          </p>



          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="name@company.com"
                {...register('email')}
                className={`w-full px-4 py-3 rounded-lg border bg-slate-50/50 dark:bg-slate-900/40 text-slate-950 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all ${
                  errors.email
                    ? 'border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-800/30'
                    : 'border-slate-200 dark:border-slate-800 focus:border-slate-950 dark:focus:border-white focus:ring-1 focus:ring-slate-950 dark:focus:ring-white'
                }`}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-500 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-slate-950 hover:underline dark:text-white transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                placeholder="**********"
                {...register('password')}
                className={`w-full px-4 py-3 rounded-lg border bg-slate-50/50 dark:bg-slate-900/40 text-slate-950 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all ${
                  errors.password
                    ? 'border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-800/30'
                    : 'border-slate-200 dark:border-slate-800 focus:border-slate-950 dark:focus:border-white focus:ring-1 focus:ring-slate-950 dark:focus:ring-white'
                }`}
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-500 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>



            {error && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg text-xs font-medium text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-950 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-md active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white dark:border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer Notice */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-900 rounded-lg text-center max-w-md w-full mx-auto">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
            Sign up creates an employee account; admin roles are assigned later by system administrators.
          </p>
        </div>
      </div>

      {/* Right side: High-contrast minimalist banner */}
      <div className="w-full md:w-[400px] lg:w-[460px] bg-slate-950 text-white p-8 sm:p-12 md:p-16 flex flex-col justify-between relative overflow-hidden border-t md:border-t-0 md:border-l border-slate-800">
        
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-md bg-white text-slate-950 flex items-center justify-center font-bold text-sm">
            AF
          </div>
          <span className="font-semibold tracking-wider text-sm">AssetFlow</span>
        </div>

        <div className="my-auto py-12 md:py-0">
          <h3 className="text-4xl font-black leading-tight mb-4 tracking-tight">
            New Here?
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Create an employee account and discover a streamlined way to track, manage, and request assets.
          </p>
          <Link
            to="/signup"
            className="inline-block bg-white text-slate-950 font-bold px-8 py-3.5 rounded-lg hover:bg-slate-100 active:scale-[0.98] transition-all text-sm text-center"
          >
            Create Account
          </Link>
        </div>

        <div className="text-[11px] text-slate-500">
          &copy; 2026 AssetFlow Corp. All rights reserved.
        </div>
      </div>

    </div>
  );
}
