import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Sparkles, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().trim().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setAuthError('');
    try {
      await login(data.email.trim(), data.password.trim());
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setAuthError(err.message);
      } else {
        setAuthError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
    setAuthError('');
    onSubmit({ email, password: pass });
  };

  return (
    <div className="min-h-screen bg-warm flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-lg mb-4">
            <span className="text-white font-black text-2xl">S</span>
          </div>
          <h1 className="text-3xl font-bold text-primary-text">
            Snack<span className="text-primary">Overflow</span>
          </h1>
          <p className="text-secondary text-sm mt-1">Office Pantry Management</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-card border border-border p-8">
          <h2 className="text-xl font-semibold text-primary-text mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-primary-text mb-1.5">
                Email address
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="you@snackoverflow.local"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white transition-colors outline-none focus:ring-2 focus:ring-primary/30 ${
                  errors.email
                    ? 'border-red-400 focus:border-red-400'
                    : 'border-border focus:border-primary'
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-primary-text mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`w-full px-4 py-2.5 pr-11 rounded-xl border text-sm bg-white transition-colors outline-none focus:ring-2 focus:ring-primary/30 ${
                    errors.password
                      ? 'border-red-400 focus:border-red-400'
                      : 'border-border focus:border-primary'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary-text transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Auth error */}
            {authError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 animate-in fade-in">
                <p className="text-red-600 text-sm">{authError}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Quick Demo Accounts Buttons */}
          <div className="mt-6 p-4 bg-soft-yellow/80 rounded-2xl border border-primary/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary-text uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} className="text-primary" />
                Quick Demo Logins
              </span>
              <span className="text-[10px] text-secondary font-medium">Click to 1-click login</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@snackoverflow.local', 'Admin@Snack2024')}
                className="py-2 px-3 rounded-xl bg-white border border-primary/30 text-xs font-bold text-primary-text hover:bg-primary hover:text-white transition-all shadow-2xs flex items-center justify-center gap-1.5"
              >
                <ShieldCheck size={13} />
                Admin
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('arjun@snackoverflow.local', 'Member@Snack2024')}
                className="py-2 px-3 rounded-xl bg-white border border-primary/30 text-xs font-bold text-primary-text hover:bg-primary hover:text-white transition-all shadow-2xs flex items-center justify-center gap-1.5"
              >
                <UserIcon size={13} />
                Member
              </button>
            </div>

            <p className="text-[10px] text-secondary/80 text-center pt-1 border-t border-primary/10">
              Admin@Snack2024 · Member@Snack2024
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-secondary mt-6">
          Snack Overflow · Office Pantry Management · Demo Environment
        </p>
      </div>
    </div>
  );
}
