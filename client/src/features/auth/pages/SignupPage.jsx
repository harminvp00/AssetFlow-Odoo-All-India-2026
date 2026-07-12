import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { signupSchema } from '../validation/authValidation';
import { signupUser, clearError } from '../store/authSlice';

export default function SignupPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data) => {
    dispatch(clearError());
    const { confirmPassword: _, ...payload } = data;
    
    const resultAction = await dispatch(signupUser(payload));
    
    if (signupUser.fulfilled.match(resultAction)) {
      toast.success('Registration completed! Please sign in with your credentials.');
      navigate('/login');
    } else {
      toast.error(resultAction.payload || 'Signup failed. Please try again.');
    }
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-slate-950 flex flex-col md:flex-row-reverse transition-all duration-300">
      
      {/* Left side: Signup form */}
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
            Register
          </span>
        </div>

        {/* Form Body */}
        <div className="my-auto py-12 max-w-md w-full mx-auto">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white mb-2">
            Create an Account
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Register as an employee to access tools and check out hardware resources.
          </p>

          {/* Signup Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Jane Doe"
                {...register('name')}
                className={`w-full px-4 py-2.5 rounded-lg border bg-slate-50/50 dark:bg-slate-900/40 text-slate-950 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all ${
                  errors.name
                    ? 'border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-800/30'
                    : 'border-slate-200 dark:border-slate-800 focus:border-slate-950 dark:focus:border-white focus:ring-1 focus:ring-slate-950 dark:focus:ring-white'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500 font-medium">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="name@company.com"
                {...register('email')}
                className={`w-full px-4 py-2.5 rounded-lg border bg-slate-50/50 dark:bg-slate-900/40 text-slate-950 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all ${
                  errors.email
                    ? 'border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-800/30'
                    : 'border-slate-200 dark:border-slate-800 focus:border-slate-950 dark:focus:border-white focus:ring-1 focus:ring-slate-950 dark:focus:ring-white'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="**********"
                  {...register('password')}
                  className={`w-full px-4 py-2.5 rounded-lg border bg-slate-50/50 dark:bg-slate-900/40 text-slate-950 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all ${
                    errors.password
                      ? 'border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-800/30'
                      : 'border-slate-200 dark:border-slate-800 focus:border-slate-950 dark:focus:border-white focus:ring-1 focus:ring-slate-950 dark:focus:ring-white'
                  }`}
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500 font-medium">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="**********"
                  {...register('confirmPassword')}
                  className={`w-full px-4 py-2.5 rounded-lg border bg-slate-50/50 dark:bg-slate-900/40 text-slate-950 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all ${
                    errors.confirmPassword
                      ? 'border-red-500 focus:ring-1 focus:ring-red-200 dark:focus:ring-red-800/30'
                      : 'border-slate-200 dark:border-slate-800 focus:border-slate-950 dark:focus:border-white focus:ring-1 focus:ring-slate-950 dark:focus:ring-white'
                  }`}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500 font-medium">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg text-xs font-medium text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-950 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-md active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white dark:border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Register</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer info card */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-900 rounded-lg text-center max-w-md w-full mx-auto text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
          Password must be 8+ characters and contain uppercase, lowercase, numeric, and special characters.
        </div>
      </div>

      {/* Right side: High-contrast minimalist banner */}
      <div className="w-full md:w-[400px] lg:w-[460px] bg-slate-950 text-white p-8 sm:p-12 md:p-16 flex flex-col justify-between relative overflow-hidden border-t md:border-t-0 md:border-r border-slate-800">
        
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-md bg-white text-slate-950 flex items-center justify-center font-bold text-sm">
            AF
          </div>
          <span className="font-semibold tracking-wider text-sm">AssetFlow</span>
        </div>

        <div className="my-auto py-12 md:py-0">
          <h3 className="text-4xl font-black leading-tight mb-4 tracking-tight">
            Welcome Back!
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Already have an active account? Jump straight back in to check your allocations and update records.
          </p>
          <Link
            to="/login"
            className="inline-block bg-white text-slate-950 font-bold px-8 py-3.5 rounded-lg hover:bg-slate-100 active:scale-[0.98] transition-all text-sm text-center"
          >
            Sign In
          </Link>
        </div>

        <div className="text-[11px] text-slate-500">
          &copy; 2026 AssetFlow Corp. All rights reserved.
        </div>
      </div>

    </div>
  );
}
