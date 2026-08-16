import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye, EyeOff, TrendingUp, Loader2, LogIn, UserPlus,
  Shield, Users, Warehouse, Landmark, Sparkles, Key
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth-context';
import { authService } from '../services/auth.service';
import { getErrorMessage } from '../lib/api';
import { Role, RegisterData } from '../types';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']),
  phone: z.string().optional(),
  department: z.string().optional(),
  bio: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;


const ROLE_OPTIONS: Array<{
  role: Role;
  title: string;
  badge: string;
  icon: any;
  color: string;
  deptLabel: string;
  deptPlaceholder: string;
  desc: string;
}> = [
  {
    role: 'SALES',
    title: 'Sales & Field CRM',
    badge: 'badge-blue',
    icon: Users,
    color: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
    deptLabel: 'Assigned Territory / Region',
    deptPlaceholder: 'e.g. Mumbai Metro & Western Maharashtra',
    desc: 'Manage customer accounts, follow-ups, and sales challans',
  },
  {
    role: 'WAREHOUSE',
    title: 'Warehouse & Logistics',
    badge: 'badge-yellow',
    icon: Warehouse,
    color: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    deptLabel: 'Assigned Warehouse Hub / Dock',
    deptPlaceholder: 'e.g. Bhiwandi Central Logistics Hub - Dock B',
    desc: 'Manage physical stock movements, items, and inventory counts',
  },
  {
    role: 'ACCOUNTS',
    title: 'Accounts & GST Officer',
    badge: 'badge-green',
    icon: Landmark,
    color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    deptLabel: 'Accounting Desk / Specialization',
    deptPlaceholder: 'e.g. GSTR-1 Invoicing & Settlement Desk',
    desc: 'Review confirmed challans, invoice ledgers, and GST reports',
  },
  {
    role: 'ADMIN',
    title: 'System Administrator',
    badge: 'badge-purple',
    icon: Shield,
    color: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
    deptLabel: 'Executive Division / Office',
    deptPlaceholder: 'e.g. Headquarters & Operations Leadership',
    desc: 'Full administrative authority across all modules and users',
  },
];

export function LoginPage() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Login form
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    setValue: setLoginValue,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  // Signup form
  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    watch: watchSignup,
    setValue: setSignupValue,
    formState: { errors: signupErrors, isSubmitting: isSignupSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: 'SALES',
    },
  });

  const selectedRole = watchSignup('role');
  const activeRoleConfig = ROLE_OPTIONS.find((r) => r.role === selectedRole) ?? ROLE_OPTIONS[0];

  const onLogin = async (data: LoginFormData) => {
    try {
      const result = await authService.login(data.email, data.password);
      login(result.token, result.user);
      toast.success(`Welcome back, ${result.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const onSignup = async (data: SignupFormData) => {
    try {
      const result = await authService.register(data as RegisterData);
      login(result.token, result.user);
      toast.success(`Account registered! Welcome to the team, ${result.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };


  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900/40 via-slate-900 to-indigo-950 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10" />
        <div className="relative z-10 max-w-md space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-xl shadow-blue-500/20">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">DistribuERP</h1>
              <p className="text-xs text-slate-400">Enterprise Operations & CRM Portal</p>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
              Real-time synchronization across all operational roles
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Empower your Sales, Warehouse, Accounts, and Management teams with instant updates, automated delivery challans, and GST compliance.
            </p>
          </div>

          <div className="space-y-3">
            {[
              'Role-tailored interfaces for Sales, Warehouse, & Accounts',
              'Real-time WebSocket event broadcasting & live sync',
              'Automated WhatsApp & Email dispatch notifications',
              '1-Click GSTR-1 & inventory valuation Excel/CSV exports',
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3 text-slate-300">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 text-xs">
                  ✓
                </div>
                <span className="text-xs font-medium">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 py-10">
        <div className="w-full max-w-lg">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-6 lg:hidden justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">DistribuERP</h1>
              <p className="text-xs text-slate-400">Operations Portal</p>
            </div>
          </div>

          <div className="card p-8 shadow-2xl">
            {/* Tabs switch */}
            <div className="flex p-1 bg-slate-800/80 rounded-xl mb-6 border border-slate-700/60">
              <button
                type="button"
                onClick={() => setTab('signin')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${
                  tab === 'signin'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LogIn className="w-4 h-4" /> Sign In
              </button>
              <button
                type="button"
                onClick={() => setTab('signup')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${
                  tab === 'signup'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-4 h-4" /> Create Account
              </button>
            </div>

            {/* TAB 1: SIGN IN */}
            {tab === 'signin' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-100">Welcome back</h2>
                  <p className="text-slate-400 text-xs mt-1">Enter your credentials to access your role portal</p>
                </div>

                <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
                  <div>
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      {...registerLogin('email')}
                      className={loginErrors.email ? 'form-input-error' : 'form-input'}
                      placeholder="you@company.com"
                      autoComplete="email"
                    />
                    {loginErrors.email && <p className="form-error">{loginErrors.email.message}</p>}
                  </div>

                  <div>
                    <label className="form-label">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...registerLogin('password')}
                        className={`${loginErrors.password ? 'form-input-error' : 'form-input'} pr-10`}
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {loginErrors.password && <p className="form-error">{loginErrors.password.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoginSubmitting}
                    className="btn-primary w-full justify-center py-2.5 mt-2"
                  >
                    {isLoginSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                    {isLoginSubmitting ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>

                {/* Quick Demo Logins */}
                <div className="pt-4 border-t border-slate-700/60">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      1-Click Demo Logins
                    </span>
                    <span className="text-[10px] text-slate-400">Click to instantly sign in</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        role: 'Admin',
                        email: 'admin@example.com',
                        password: 'Admin@123',
                        icon: Shield,
                        badgeColor: 'border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/60',
                        iconColor: 'text-purple-400',
                      },
                      {
                        role: 'Sales',
                        email: 'sales@example.com',
                        password: 'Sales@123',
                        icon: Users,
                        badgeColor: 'border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/60',
                        iconColor: 'text-blue-400',
                      },
                      {
                        role: 'Warehouse',
                        email: 'warehouse@example.com',
                        password: 'Warehouse@123',
                        icon: Warehouse,
                        badgeColor: 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/60',
                        iconColor: 'text-amber-400',
                      },
                      {
                        role: 'Accounts',
                        email: 'accounts@example.com',
                        password: 'Accounts@123',
                        icon: Landmark,
                        badgeColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/60',
                        iconColor: 'text-emerald-400',
                      },
                    ].map((demo) => {
                      const Icon = demo.icon;
                      return (
                        <button
                          key={demo.role}
                          type="button"
                          disabled={isLoginSubmitting}
                          onClick={() => {
                            setLoginValue('email', demo.email, { shouldValidate: true });
                            setLoginValue('password', demo.password, { shouldValidate: true });
                            onLogin({ email: demo.email, password: demo.password });
                          }}
                          className={`p-2.5 rounded-lg border text-left transition-all duration-150 flex items-center justify-between group ${demo.badgeColor}`}
                          title={`Sign in as ${demo.role} (${demo.email})`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${demo.iconColor}`} />
                            <div>
                              <div className="text-xs font-semibold">{demo.role}</div>
                              <div className="text-[10px] text-slate-400">{demo.email}</div>
                            </div>
                          </div>
                          <Key className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SIGN UP */}
            {tab === 'signup' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-100">Create Staff Account</h2>
                  <p className="text-slate-400 text-xs mt-1">Select your operational role and personalize your bio</p>
                </div>

                <form onSubmit={handleSignupSubmit(onSignup)} className="space-y-4">
                  {/* Role Selector Grid */}
                  <div>
                    <label className="form-label">Select Your Operational Role *</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {ROLE_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const isSelected = selectedRole === opt.role;
                        return (
                          <button
                            key={opt.role}
                            type="button"
                            onClick={() => setSignupValue('role', opt.role)}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-blue-500/15 shadow-md shadow-blue-500/10'
                                : 'border-slate-700/80 bg-slate-800/40 hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-700/60 text-slate-300'}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              {isSelected && <span className="text-xs text-blue-400 font-bold">✓</span>}
                            </div>
                            <p className="text-xs font-bold text-slate-200">{opt.title}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{opt.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Core User Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Full Name *</label>
                      <input
                        {...registerSignup('name')}
                        className={signupErrors.name ? 'form-input-error' : 'form-input'}
                        placeholder="John Doe"
                      />
                      {signupErrors.name && <p className="form-error">{signupErrors.name.message}</p>}
                    </div>

                    <div>
                      <label className="form-label">Email Address *</label>
                      <input
                        type="email"
                        {...registerSignup('email')}
                        className={signupErrors.email ? 'form-input-error' : 'form-input'}
                        placeholder="john@company.com"
                      />
                      {signupErrors.email && <p className="form-error">{signupErrors.email.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Password * (Min. 8 chars)</label>
                      <input
                        type="password"
                        {...registerSignup('password')}
                        className={signupErrors.password ? 'form-input-error' : 'form-input'}
                        placeholder="••••••••"
                      />
                      {signupErrors.password && <p className="form-error">{signupErrors.password.message}</p>}
                    </div>

                    <div>
                      <label className="form-label">Contact Phone (Optional)</label>
                      <input
                        {...registerSignup('phone')}
                        className="form-input"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>

                  {/* Role-Specific Field */}
                  <div>
                    <label className="form-label flex items-center justify-between">
                      <span>{activeRoleConfig.deptLabel}</span>
                      <span className="text-[10px] text-blue-400 font-semibold">{activeRoleConfig.role}</span>
                    </label>
                    <input
                      {...registerSignup('department')}
                      className="form-input"
                      placeholder={activeRoleConfig.deptPlaceholder}
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="form-label">Bio / Profile Description</label>
                    <textarea
                      {...registerSignup('bio')}
                      rows={2}
                      className="form-input text-xs"
                      placeholder="Brief background, specialty, or shift details..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSignupSubmitting}
                    className="btn-primary w-full justify-center py-2.5 mt-2"
                  >
                    {isSignupSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    {isSignupSubmitting ? 'Creating account...' : `Sign Up as ${activeRoleConfig.title}`}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
