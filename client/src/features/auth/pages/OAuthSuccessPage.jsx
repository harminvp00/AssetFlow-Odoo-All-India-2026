import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { syncToken, getCurrentUser } from '../store/authSlice';

export default function OAuthSuccessPage() {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      const token = searchParams.get('token');

      if (!token) {
        toast.error('Authentication failed. No access token provided.');
        navigate('/login', { replace: true });
        return;
      }

      try {
        // Sync token in Redux store and Axios client instance
        dispatch(syncToken(token));

        // Fetch user details with the token
        const resultAction = await dispatch(getCurrentUser());
        
        if (getCurrentUser.fulfilled.match(resultAction)) {
          toast.success('Successfully logged in with Google!');
          navigate('/dashboard', { replace: true });
        } else {
          toast.error(resultAction.payload || 'Failed to initialize session profile.');
          navigate('/login', { replace: true });
        }
      } catch (err) {
        toast.error('An error occurred during authentication setup.');
        navigate('/login', { replace: true });
      }
    };

    handleAuth();
  }, [searchParams, dispatch, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600 dark:border-slate-800 dark:border-t-emerald-500" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 animate-pulse">
          Finalizing Google sign-in...
        </p>
      </div>
    </div>
  );
}
