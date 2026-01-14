
import {
  Moon, Sun,
  BarChart3, Database,
  Users, Search, Mail, Phone,
  ChevronRight, X,
  Loader2, Eye, EyeOff,
  TrendingUp, Target, DollarSign, RefreshCw, Grid,
  Filter, Percent, ShoppingBag, Target as CplIcon,
  Calendar, Layers, Check,
  MousePointer2, Eye as ReachIcon, Layout,
  Save, AlertCircle, Award, Trophy, Star,
  Terminal, Code, Clipboard,
  Play, Video, Activity,
  BarChart as VerticalBarIcon
} from 'lucide-react';
import React, { useEffect, useState, useMemo, useRef } from 'react';

import { ASSETS, FORMATTERS } from './constants';
import { fetchData, processSupabaseData } from './services/dataService';
import { DashboardData, LoadingState, UserAuth, ClientLead, DashboardGoals, GoalMode, CreativePlayback } from './types';
import { FunnelChartComponent } from './components/FunnelChartComponent';
import { KPICard, KPIStatus } from './components/KPICard';
import { supabase } from './services/supabase';

const getRowValue = (row: any, possibleKeys: string[]) => {
  if (!row) return null;
  const rowKeys = Object.keys(row);
  for (const key of possibleKeys) {
    const normSearch = key.toLowerCase().replace(/[\s_]/g, '');
    const foundKey = rowKeys.find(rk => rk.toLowerCase().replace(/[\s_]/g, '') === normSearch);
    if (foundKey && row[foundKey] !== null && row[foundKey] !== undefined) return String(row[foundKey]);
  }
  return null;
};

const CAMPAIGN_KEYS = ["Campaign", "Campanha", "campaign_name", "Campaign Name"];
const ADSET_KEYS = ["Ad Set Name", "Conjunto de Anuncios", "ad_set_name", "adset_name", "Conjunto de anúncios"];
const AD_KEYS = ["Ad Name", "Nome do Anuncio", "ad_name", "Nome do anúncio", "Anúncio"];

const StatusBadge = ({ status }: { status: KPIStatus }) => {
  if (!status) return null;
  const color = status === 'BOM' ? 'bg-emerald-500' : status === 'MÉDIA' ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <span className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-black text-white uppercase tracking-tighter ${color}`}>
      {status}
    </span>
  );
};

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('even_theme') === 'dark');
  const [loading, setLoading] = useState<LoadingState>(LoadingState.IDLE);
  const [isFiltering, setIsFiltering] = useState(false);
  const [baseData, setBaseData] = useState<DashboardData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'metas' | 'marketing' | 'sales'>('overview');

  const [isInspectOpen, setIsInspectOpen] = useState(false);
  const [inspectTable, setInspectTable] = useState<string | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => localStorage.getItem('even_auth') === 'true');
  const [currentUser, setCurrentUser] = useState<UserAuth | null>(() => {
    const saved = localStorage.getItem('even_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [goals, setGoals] = useState<DashboardGoals>(() => {
    const saved = localStorage.getItem(`even_goals_${currentUser?.id || 'default'}`);
    if (saved) return JSON.parse(saved);
    return {
      amountSpent: { value: 0, mode: 'monthly' },
      leads: { value: 0, mode: 'monthly' },
      cpl: { value: 0, mode: 'fixed' },
      ctr: { value: 0, mode: 'fixed' },
      cpm: { value: 0, mode: 'fixed' },
      frequency: { value: 0, mode: 'fixed' }
    };
  });

  const GoalInputCard = ({ icon: Icon, title, metricKey }: { icon: any, title: string, metricKey: keyof DashboardGoals }) => (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-xl text-primary"><Icon size={20} /></div>
        <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase italic tracking-tight">{title}</h4>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-2 block">Valor Alvo</label>
          <input
            type="number"
            value={goals[metricKey].value}
            onChange={(e) => setGoals({ ...goals, [metricKey]: { ...goals[metricKey], value: parseFloat(e.target.value) || 0 } })}
            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all dark:text-white italic"
          />
        </div>
        {(metricKey === 'amountSpent' || metricKey === 'leads') && (
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-2 block">Modo de Cálculo</label>
            <div className="flex gap-2">
              {(['daily', 'monthly', 'fixed'] as GoalMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setGoals({ ...goals, [metricKey]: { ...goals[metricKey], mode: m } })}
                  className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase italic transition-all ${goals[metricKey].mode === m ? 'bg-primary text-white shadow-md' : 'bg-slate-100 dark:bg-slate-900 text-slate-400'}`}
                >
                  {m === 'daily' ? 'Diário' : m === 'monthly' ? 'Mensal' : 'Fixo'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [isCampaignDropdownOpen, setIsCampaignDropdownOpen] = useState(false);
  const campaignRef = useRef<HTMLDivElement>(null);

  const [selectedAdSets, setSelectedAdSets] = useState<string[]>([]);
  const [isAdSetDropdownOpen, setIsAdSetDropdownOpen] = useState(false);
  const adSetRef = useRef<HTMLDivElement>(null);

  const [selectedAds, setSelectedAds] = useState<string[]>([]);
  const [isAdDropdownOpen, setIsAdDropdownOpen] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);

  const [salesSearch, setSalesSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');

  const loadData = async (silent = false) => {
    if (!currentUser) return;
    const tablesToFetch = [`Marketing_${currentUser.id}`, `Vendas_${currentUser.id}`, `Dados`];
    if (!silent) setLoading(LoadingState.LOADING);
    const result = await fetchData(tablesToFetch);
    setBaseData(result.data);
    if (result.error) setErrorMessage(result.error);
    setLoading(LoadingState.SUCCESS);
    if (result.data.fetchedTables && result.data.fetchedTables.length > 0) {
      setInspectTable(result.data.fetchedTables[0]);
    }
  };

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated, currentUser?.id]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('even_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('even_theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (campaignRef.current && !campaignRef.current.contains(event.target as Node)) setIsCampaignDropdownOpen(false);
      if (adSetRef.current && !adSetRef.current.contains(event.target as Node)) setIsAdSetDropdownOpen(false);
      if (adRef.current && !adRef.current.contains(event.target as Node)) setIsAdDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filterOptions = useMemo(() => {
    if (!baseData?.rawDataByTable) return { campaigns: [], adSets: [], ads: [] };
    const marketingTable = Object.keys(baseData.rawDataByTable).find(k => k.toLowerCase().includes('marketing'));
    if (!marketingTable) return { campaigns: [], adSets: [], ads: [] };
    const rows = (baseData.rawDataByTable[marketingTable] as any[]);
    const campaigns = Array.from(new Set(rows.map(r => getRowValue(r, CAMPAIGN_KEYS)).filter(Boolean))).sort() as string[];
    const adSetsRows = selectedCampaigns.length > 0 ? rows.filter(r => selectedCampaigns.includes(getRowValue(r, CAMPAIGN_KEYS) || '')) : rows;
    const adSets = Array.from(new Set(adSetsRows.map(r => getRowValue(r, ADSET_KEYS)).filter(Boolean))).sort() as string[];
    let adsRows = rows;
    if (selectedCampaigns.length > 0) adsRows = adsRows.filter(r => selectedCampaigns.includes(getRowValue(r, CAMPAIGN_KEYS) || ''));
    if (selectedAdSets.length > 0) adsRows = adsRows.filter(r => selectedAdSets.includes(getRowValue(r, ADSET_KEYS) || ''));
    const ads = Array.from(new Set(adsRows.map(r => getRowValue(r, AD_KEYS)).filter(Boolean))).sort() as string[];
    return { campaigns, adSets, ads };
  }, [baseData, selectedCampaigns, selectedAdSets]);

  // Efeito para disparar animação de filtragem
  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => setIsFiltering(false), 300);
    return () => clearTimeout(timer);
  }, [startDate, endDate, selectedCampaigns, selectedAdSets, selectedAds]);

  const data = useMemo(() => {
    if (!baseData?.rawDataByTable) return baseData;
    const filteredRawData: Record<string, any[]> = {};
    const allFilteredRows: any[] = [];
    Object.entries(baseData.rawDataByTable).forEach(([tableName, rows]) => {
      const filtered = (rows as any[]).filter(row => {
        if (selectedCampaigns.length > 0) { const val = getRowValue(row, CAMPAIGN_KEYS); if (val && !selectedCampaigns.includes(val)) return false; }
        if (selectedAdSets.length > 0) { const val = getRowValue(row, ADSET_KEYS); if (val && !selectedAdSets.includes(val)) return false; }
        if (selectedAds.length > 0) { const val = getRowValue(row, AD_KEYS); if (val && !selectedAds.includes(val)) return false; }
        if (startDate || endDate) {
          const rowDateRaw = row.Date || row.Day || row.dia || row.data || row.created_at;
          if (rowDateRaw) { const rowDate = new Date(rowDateRaw); if (startDate && rowDate < new Date(startDate)) return false; if (endDate && rowDate > new Date(endDate)) return false; }
        }
        return true;
      });
      filteredRawData[tableName] = filtered;
      allFilteredRows.push(...filtered);
    });
    return processSupabaseData(allFilteredRows, baseData.fetchedTables || [], filteredRawData);
  }, [baseData, startDate, endDate, selectedCampaigns, selectedAdSets, selectedAds]);

  const handleSaveGoals = () => {
    localStorage.setItem(`even_goals_${currentUser?.id || 'default'}`, JSON.stringify(goals));
    alert('Metas salvas com sucesso!');
  };

  const getScaledValue = (metric: { value: number; mode: GoalMode }) => {
    if (!startDate || !endDate || metric.mode === 'fixed') return metric.value;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const factor = metric.mode === 'monthly' ? (diffDays / 30) : diffDays;
    return metric.value * factor;
  };

  const scaledGoals = useMemo(() => ({
    amountSpent: getScaledValue(goals.amountSpent),
    leads: getScaledValue(goals.leads),
    cpl: goals.cpl.value,
    ctr: goals.ctr.value,
    cpm: goals.cpm.value,
    frequency: goals.frequency.value
  }), [goals, startDate, endDate]);

  const calculateStatus = (actual: number, target: number, type: 'higher-better' | 'lower-better'): KPIStatus => {
    if (target === 0) return undefined;
    const diff = (actual / target);
    const buffer = 0.05;
    if (type === 'higher-better') {
      if (diff > (1 + buffer)) return 'BOM';
      if (diff < (1 - buffer)) return 'RUIM';
      return 'MÉDIA';
    } else {
      if (diff < (1 - buffer)) return 'BOM';
      if (diff > (1 + buffer)) return 'RUIM';
      return 'MÉDIA';
    }
  };

  const statusMap = useMemo(() => {
    if (!data) return {};
    return {
      amountSpent: calculateStatus(data.metrics.totalSpend, scaledGoals.amountSpent, 'lower-better'),
      leads: calculateStatus(data.metrics.totalLeads, scaledGoals.leads, 'higher-better'),
      cpl: calculateStatus(data.metrics.marketingMetrics.cpl, scaledGoals.cpl, 'lower-better'),
      ctr: calculateStatus(data.metrics.marketingMetrics.ctr, scaledGoals.ctr, 'higher-better'),
      cpm: calculateStatus(data.metrics.marketingMetrics.cpm, scaledGoals.cpm, 'lower-better'),
      frequency: calculateStatus(data.metrics.marketingMetrics.frequency, scaledGoals.frequency, 'lower-better')
    };
  }, [data, scaledGoals]);

  const adRankingData = useMemo(() => {
    if (!data?.rawDataByTable) return [];
    const marketingTable = Object.keys(data.rawDataByTable).find(k => k.toLowerCase().includes('marketing'));
    if (!marketingTable) return [];
    const rows = data.rawDataByTable[marketingTable] as any[];
    const adStats: Record<string, { campaign: string, adset: string, ad: string, leads: number, spend: number, clicks: number, impressions: number }> = {};
    rows.forEach(row => {
      const campaign = getRowValue(row, CAMPAIGN_KEYS) || 'N/A';
      const adset = getRowValue(row, ADSET_KEYS) || 'N/A';
      const ad = getRowValue(row, AD_KEYS) || 'N/A';
      const key = `${campaign}-${adset}-${ad}`;
      const leads = parseFloat(getRowValue(row, ["leads", "lead count", "leads_gerados", "results"]) || '0');
      const spend = parseFloat(getRowValue(row, ["Amount Spent", "investimento", "valor gasto", "spent"]) || '0');
      const clicks = parseFloat(getRowValue(row, ["Link Clicks", "cliques", "clicks"]) || '0');
      const impressions = parseFloat(getRowValue(row, ["Impressions", "impressoes"]) || '0');
      if (!adStats[key]) { adStats[key] = { campaign, adset, ad, leads: 0, spend: 0, clicks: 0, impressions: 0 }; }
      adStats[key].leads += leads;
      adStats[key].spend += spend;
      adStats[key].clicks += clicks;
      adStats[key].impressions += impressions;
    });
    return Object.values(adStats)
      .map(item => ({ ...item, cpl: item.leads > 0 ? item.spend / item.leads : item.spend, ctr: item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0 }))
      .sort((a, b) => { if (b.leads !== a.leads) return b.leads - a.leads; if (a.cpl !== b.cpl) return a.cpl - b.cpl; return b.ctr - a.ctr; });
  }, [data]);

  const orderedStages = useMemo(() => {
    if (!data?.funnelData) return [];
    return data.funnelData.map(f => f.stage);
  }, [data]);

  const filteredLeads = useMemo(() => {
    if (!data?.leadsList) return [];
    return data.leadsList.filter(lead => {
      const matchesSearch = lead.name.toLowerCase().includes(salesSearch.toLowerCase()) || lead.email.toLowerCase().includes(salesSearch.toLowerCase()) || lead.phone.toLowerCase().includes(salesSearch.toLowerCase());
      const matchesStage = selectedStage === 'all' || lead.stage === selectedStage;
      return matchesSearch && matchesStage;
    });
  }, [data, salesSearch, selectedStage]);

  const toggleFilter = (list: string[], setList: (l: string[]) => void, item: string) => {
    if (item === "__ALL__") { setList([]); return; }
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const FilterDropdown = ({ title, options, selected, onToggle, isOpen, setIsOpen, icon: Icon, dropdownRef }: any) => {
    const [searchTerm, setSearchTerm] = useState('');
    useEffect(() => { if (!isOpen) setSearchTerm(''); }, [isOpen]);
    const filteredOptions = useMemo(() => !searchTerm ? options : options.filter((opt: string) => opt.toLowerCase().includes(searchTerm.toLowerCase())), [options, searchTerm]);
    return (
      <div ref={dropdownRef} className="relative flex-1 min-w-[200px] bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3 cursor-pointer group hover:border-primary/30 transition-all" onClick={() => setIsOpen(!isOpen)}>
        <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-primary group-hover:bg-primary/10 transition-colors"><Icon size={16} /></div>
        <div className="flex-1 overflow-hidden"><p className="text-[9px] font-black text-slate-400 uppercase italic mb-0.5 tracking-wider">{title}</p><p className="text-xs font-bold text-slate-700 dark:text-white truncate italic">{selected.length === 0 ? `Todos ${title}` : selected.length === 1 ? selected[0] : `${selected.length} Selecionados`}</p></div>
        <ChevronRight size={16} className={`text-slate-300 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-full min-w-[340px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 p-4 max-h-[500px] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="relative mb-4 px-1"><div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Search size={14} /></div><input type="text" autoFocus placeholder={`Pesquisar ${title.toLowerCase()}...`} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none dark:text-white italic focus:ring-2 focus:ring-primary/20 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onClick={(e) => e.stopPropagation()} />{searchTerm && (<button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"><X size={14} /></button>)}</div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1"><button onClick={() => { onToggle("__ALL__"); setIsOpen(false); }} className={`w-full text-left px-4 py-3 rounded-lg text-xs font-bold italic mb-2 transition-all ${selected.length === 0 ? 'bg-primary text-white shadow-md' : 'hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-400'}`}>Todos {title}</button><div className="h-px bg-slate-100 dark:bg-slate-700 my-2"></div><div className="space-y-1">{filteredOptions.map((opt: string) => (<button key={opt} onClick={() => onToggle(opt)} className={`w-full flex items-start justify-between px-4 py-3.5 rounded-lg text-[11px] font-bold italic transition-colors text-left border-b border-slate-50 dark:border-slate-700/50 last:border-none ${selected.includes(opt) ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300'}`}><span className="whitespace-normal leading-relaxed pr-4 flex-1 break-words">{opt}</span>{selected.includes(opt) && <Check size={14} className="flex-shrink-0 mt-0.5 text-primary" />}</button>))}</div>{filteredOptions.length === 0 && (<div className="px-4 py-10 text-center"><Database size={24} className="mx-auto text-slate-200 mb-3" /><p className="text-[10px] font-bold text-slate-400 italic">{searchTerm ? 'Nenhum resultado encontrado.' : `Nenhuma opção disponível.`}</p></div>)}</div>
          </div>
        )}
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6 font-sans">
        <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-2xl p-12 flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
          <img src={ASSETS.LOGO} alt="Even" className="h-16 mb-6" /><h1 className="text-2xl font-bold text-[#1e293b] mb-1">Even Digital</h1><p className="text-sm text-slate-400 mb-10 font-medium">Performance Marketing Dashboard</p>
          <form onSubmit={async (e) => { e.preventDefault(); setLoginError(''); setIsLoggingIn(true); try { const { data: userRows, error } = await supabase.from('Logins Even').select('*').eq('user', loginForm.username).eq('senha', loginForm.password).single(); if (error || !userRows) { setLoginError('Acesso inválido.'); setIsLoggingIn(false); return; } const authUser: UserAuth = { id: userRows.id, username: userRows.user, role: userRows.user === 'admin' ? 'admin' : 'user' }; localStorage.setItem('even_auth', 'true'); localStorage.setItem('even_user', JSON.stringify(authUser)); setCurrentUser(authUser); setIsAuthenticated(true); } catch (err) { setLoginError('Erro de conexão.'); } finally { setIsLoggingIn(false); } }} className="w-full space-y-5"><div className="space-y-2"><label className="text-sm font-semibold text-slate-600 ml-1">Usuário</label><input type="text" placeholder="Digite seu usuário" required className="w-full px-6 py-4 bg-[#333333] border-none rounded-xl text-sm font-medium text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary/50 transition-all" value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} /></div><div className="space-y-2"><label className="text-sm font-semibold text-slate-600 ml-1">Senha</label><div className="relative w-full"><input type={showPassword ? "text" : "password"} placeholder="********" required className="w-full px-6 py-4 bg-[#333333] border-none rounded-xl text-sm font-medium text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary/50 transition-all pr-12" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>{loginError && <div className="text-rose-500 text-[11px] font-bold text-center bg-rose-50 py-2 rounded-lg">{loginError}</div>}<button type="submit" disabled={isLoggingIn} className="w-full py-4 mt-4 bg-primary hover:bg-primary-600 text-white rounded-xl font-bold text-base shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all">{isLoggingIn ? <Loader2 className="animate-spin" size={20} /> : "Acessar Dashboard"}</button></form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-500 font-sans ${darkMode ? 'dark' : ''}`}>
      <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen fixed z-20">
        <div className="p-10 border-b border-slate-100 dark:border-slate-800"><div className="flex items-center gap-3"><img src={ASSETS.LOGO} alt="Logo" className="h-8" /><div><h2 className="text-lg font-black text-slate-900 dark:text-white uppercase italic leading-none">Even</h2><span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] block mt-1">RELATÓRIOS</span></div></div></div>
        <nav className="flex-1 px-6 py-10 space-y-3">{[{ id: 'overview', label: 'Visão Geral', icon: <Grid size={18} /> }, { id: 'metas', label: 'Metas', icon: <Target size={18} /> }, { id: 'marketing', label: 'Marketing', icon: <BarChart3 size={18} /> }, { id: 'sales', label: 'Vendas', icon: <Users size={18} /> }].map(item => (<button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex items-center w-full px-6 py-4 rounded-xl font-black uppercase italic text-xs tracking-wider transition-all ${activeTab === item.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><span className="mr-4">{item.icon}</span> {item.label}</button>))}</nav>
        <div className="p-8"><div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-black text-xs">G</div><div><p className="text-[10px] font-black text-slate-800 dark:text-white uppercase italic leading-none">Grupo Pedrosa</p><span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">CLIENTE</span></div></div><button onClick={() => { localStorage.clear(); setIsAuthenticated(false); setCurrentUser(null); }} className="mt-4 w-full py-2.5 bg-slate-900 dark:bg-slate-950 text-white rounded-xl text-[9px] font-black uppercase italic hover:bg-rose-500 transition-all active:scale-95 shadow-lg">Sair do Painel</button></div></div>
      </aside>

      <main className="flex-1 ml-72 p-12 overflow-auto h-screen custom-scrollbar relative">
        <header className="flex items-center justify-between mb-12">
          <div><h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">RESUMO DO DASHBOARD</h1><p className="text-slate-500 text-sm font-medium mt-1">Projeto: <span className="text-primary font-bold italic">High Contorno</span></p></div>
          <div className="flex items-center gap-4">
            {currentUser?.role === 'admin' && (
              <button onClick={() => setIsInspectOpen(true)} className="flex items-center gap-2 px-6 py-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase italic tracking-widest text-primary hover:bg-primary/5 transition-all shadow-sm group"><Database size={16} className="group-hover:rotate-12 transition-transform" /> Inspecionar Dados</button>
            )}
            <button onClick={() => setDarkMode(!darkMode)} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 shadow-sm transition-all hover:bg-slate-50">{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
          </div>
        </header>

        {isInspectOpen && currentUser?.role === 'admin' && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 sm:p-12 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsInspectOpen(false)}></div>
            <div className="relative w-full max-w-6xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden h-full max-h-[85vh]">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
                <div className="flex items-center gap-4"><div className="p-3 bg-primary/10 rounded-2xl text-primary"><Terminal size={24} /></div><div><h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Explorador de Dados Supabase</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic mt-0.5">Visão Técnica: Todas as tabelas e colunas vinculadas ao seu usuário</p></div></div>
                <button onClick={() => setIsInspectOpen(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"><X size={24} /></button>
              </div>
              <div className="flex flex-1 overflow-hidden">
                <div className="w-72 border-r border-slate-100 dark:border-slate-800 p-6 space-y-2 overflow-y-auto bg-slate-50/30 dark:bg-slate-950/10">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 italic">Tabelas Encontradas</p>
                  {baseData?.fetchedTables?.map(tableName => (<button key={tableName} onClick={() => setInspectTable(tableName)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${inspectTable === tableName ? 'bg-primary text-white shadow-lg shadow-primary/20 font-bold' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'}`}><Layers size={16} /><span className="text-xs truncate">{tableName}</span></button>))}
                </div>
                <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
                  {inspectTable && baseData?.rawDataByTable?.[inspectTable] ? (
                    <><div className="p-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between"><div className="flex items-center gap-3 text-[10px] font-black uppercase italic tracking-widest text-slate-400"><Code size={14} /> Tabela: {inspectTable} ({baseData.rawDataByTable[inspectTable].length} linhas)</div><button onClick={() => { navigator.clipboard.writeText(JSON.stringify(baseData?.rawDataByTable?.[inspectTable], null, 2)); alert('JSON copiado!'); }} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase italic hover:bg-primary hover:text-white transition-all"><Clipboard size={12} /> Copiar Tudo</button></div><div className="flex-1 overflow-auto p-8 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/20"><pre className="text-[11px] font-mono leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre">{JSON.stringify(baseData.rawDataByTable[inspectTable], null, 2)}</pre></div></>
                  ) : (<div className="flex-1 flex flex-col items-center justify-center p-12 text-center"><Database size={64} className="text-slate-100 dark:text-slate-800 mb-6" /><p className="text-sm font-black text-slate-300 uppercase italic tracking-widest">Selecione uma tabela para visualizar os dados brutos</p></div>)}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'overview' && data && (
          <div className={`space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10 transition-opacity ${isFiltering ? 'opacity-50' : 'opacity-100'}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <KPICard title="VGV Gerenciado" value={FORMATTERS.currency(data.clientInfo.vgv)} meta="FONTE DE DADOS" metaValue="Base Dados" icon={<TrendingUp size={16} />} />
              <KPICard title="Vendas Concluídas" value={FORMATTERS.currency(data.metrics.totalRevenue)} meta="STATUS ATUAL" metaValue="VGV Realizado" icon={<ShoppingBag size={16} />} trend="up" />
              <KPICard title="Aproveitamento VGV" value={FORMATTERS.percent((data.metrics.totalRevenue / (data.clientInfo.vgv || 1)) * 100)} meta="TAXA DE SUCESSO" metaValue="Performance" icon={<Percent size={16} />} trend="up" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <KPICard title="Investimento em Mídia" value={FORMATTERS.currency(data.metrics.totalSpend)} meta="META MENSAL" metaValue={FORMATTERS.currency(scaledGoals.amountSpent)} icon={<DollarSign size={16} />} statusTag={statusMap.amountSpent} inverseColors={true} />
              <KPICard title="Total de Leads (CRM)" value={FORMATTERS.number(data.metrics.totalLeads)} meta="META MENSAL" metaValue={FORMATTERS.number(scaledGoals.leads)} icon={<RefreshCw size={16} />} statusTag={statusMap.leads} />
              <KPICard title="CPL Médio" value={FORMATTERS.currency(data.metrics.cac)} meta="META CPL" metaValue={FORMATTERS.currency(scaledGoals.cpl)} icon={<CplIcon size={16} />} statusTag={statusMap.cpl} />
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center gap-6">
              <FilterDropdown title="Campanhas" options={filterOptions.campaigns} selected={selectedCampaigns} onToggle={(camp: any) => toggleFilter(selectedCampaigns, setSelectedCampaigns, camp)} isOpen={isCampaignDropdownOpen} setIsOpen={setIsCampaignDropdownOpen} icon={Layers} dropdownRef={campaignRef} />
              <div className="h-10 w-px bg-slate-200 dark:bg-slate-700 hidden lg:block"></div>
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl flex-1 min-w-[300px] border border-slate-200 dark:border-slate-800"><Calendar size={18} className="text-primary" /><div className="flex-1 flex gap-4"><div className="flex-1"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic mb-0.5">Início:</p><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-transparent border-none text-xs font-bold dark:text-white outline-none italic cursor-pointer" /></div><div className="flex-1"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic mb-0.5">Fim:</p><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-transparent border-none text-xs font-bold dark:text-white outline-none italic cursor-pointer" /></div></div></div>
            </div>

            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-7 bg-white dark:bg-slate-800 p-10 rounded-[32px] shadow-sm border border-slate-200 dark:border-slate-700"><div className="flex items-center justify-between mb-8 px-4"><div className="flex items-center gap-3"><Filter size={20} className="text-primary" /><h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Fluxo do Funil de Vendas</h3></div><div className="px-5 py-2 bg-primary/10 rounded-full text-xs font-black text-primary italic">TOTAL: {data?.funnelData?.[0]?.count || 0} LEADS</div></div><FunnelChartComponent data={data.funnelData} /></div>
              <div className="col-span-5 flex flex-col gap-8"><div className="bg-[#1e293b] dark:bg-slate-900 p-12 rounded-[32px] text-white relative overflow-hidden flex flex-col justify-between shadow-lg min-h-[260px]"><div className="relative z-10"><p className="text-sm font-bold opacity-60 mb-2 uppercase tracking-widest">ROI Estratégico Estimado</p><p className="text-7xl font-black mb-6 tracking-tighter leading-none italic">{data.metrics.totalSpend > 0 ? (data.metrics.totalRevenue / data.metrics.totalSpend).toFixed(1) : 0}x</p><div className="max-w-[240px]"><p className="text-[11px] opacity-40 leading-relaxed font-bold uppercase italic tracking-widest">Multiplicador de retorno baseado no faturamento real identificado no CRM contra o investimento em anúncios.</p></div></div><div className="absolute -right-10 -bottom-10 opacity-5 rotate-12"><TrendingUp size={280} /></div></div><div className="bg-white dark:bg-slate-800 p-10 rounded-[32px] shadow-sm border border-slate-200 dark:border-slate-700"><h4 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter mb-8">Eficiência de Conversão</h4><div className="space-y-8"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-1">Total Investido</p><p className="text-2xl font-black text-primary italic leading-none">{FORMATTERS.currency(data.metrics.totalSpend)}</p></div><div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-1">Total Vendido</p><p className="text-2xl font-black text-emerald-500 italic leading-none">{FORMATTERS.currency(data.metrics.totalRevenue)}</p></div></div><div className="h-3 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden flex shadow-inner"><div className="h-full bg-primary" style={{ width: '35%' }}></div><div className="h-full bg-emerald-500" style={{ width: '65%' }}></div></div></div></div></div>
            </div>
          </div>
        )}

        {activeTab === 'metas' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-white dark:bg-slate-800 p-12 rounded-[40px] border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12"><div className="flex items-center gap-6"><div className="p-4 bg-primary/10 rounded-2xl text-primary shadow-inner"><Target size={32} /></div><div><h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none mb-2">DEFINIÇÃO DE METAS</h2><p className="text-[11px] text-slate-400 font-bold italic uppercase tracking-[0.2em]">Ajuste os objetivos técnicos do projeto</p></div></div><button onClick={handleSaveGoals} className="px-10 py-5 bg-primary hover:bg-primary-600 text-white rounded-2xl font-black text-xs uppercase italic shadow-lg shadow-primary/30 flex items-center gap-3 transition-all active:scale-95 group"><Save size={20} className="group-hover:scale-110 transition-transform" /> ATUALIZAR METAS</button></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                <GoalInputCard icon={DollarSign} title="1. Quantia Gasta" metricKey="amountSpent" />
                <GoalInputCard icon={Users} title="2. Leads" metricKey="leads" />
                <GoalInputCard icon={CplIcon} title="3. Custo por Lead" metricKey="cpl" />
                <GoalInputCard icon={Percent} title="4. CTR" metricKey="ctr" />
                <GoalInputCard icon={ReachIcon} title="5. CPM" metricKey="cpm" />
                <GoalInputCard icon={RefreshCw} title="6. Frequência" metricKey="frequency" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'marketing' && data && (
          <div className={`space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10 transition-opacity ${isFiltering ? 'opacity-50' : 'opacity-100'}`}>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap gap-6">
              <FilterDropdown title="Campanhas" options={filterOptions.campaigns} selected={selectedCampaigns} onToggle={(i: any) => toggleFilter(selectedCampaigns, setSelectedCampaigns, i)} isOpen={isCampaignDropdownOpen} setIsOpen={setIsCampaignDropdownOpen} icon={Layers} dropdownRef={campaignRef} />
              <FilterDropdown title="Conjuntos" options={filterOptions.adSets} selected={selectedAdSets} onToggle={(i: any) => toggleFilter(selectedAdSets, setSelectedAdSets, i)} isOpen={isAdSetDropdownOpen} setIsOpen={setIsAdSetDropdownOpen} icon={Layout} dropdownRef={adSetRef} />
              <FilterDropdown title="Anúncios" options={filterOptions.ads} selected={selectedAds} onToggle={(i: any) => toggleFilter(selectedAds, setSelectedAds, i)} isOpen={isAdDropdownOpen} setIsOpen={setIsAdDropdownOpen} icon={Target} dropdownRef={adRef} />
              <div className="h-10 w-px bg-slate-200 dark:bg-slate-700 hidden lg:block"></div>
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl flex-1 min-w-[300px] border border-slate-200 dark:border-slate-800"><Calendar size={18} className="text-primary" /><div className="flex-1 flex gap-4"><div className="flex-1"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic mb-0.5">Início:</p><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-transparent border-none text-xs font-bold dark:text-white outline-none italic cursor-pointer" /></div><div className="flex-1"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic mb-0.5">Fim:</p><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-transparent border-none text-xs font-bold dark:text-white outline-none italic cursor-pointer" /></div></div></div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
              <div className="grid grid-cols-5 divide-x divide-slate-100 dark:divide-slate-700">
                {[
                  { title: "Investimento", val: FORMATTERS.currency(data.metrics.totalSpend), icon: <DollarSign size={14} />, meta: FORMATTERS.currency(scaledGoals.amountSpent), status: statusMap.amountSpent },
                  { title: "Alcance", val: FORMATTERS.number(data.metrics.marketingMetrics.reach), icon: <ReachIcon size={14} />, meta: "Único" },
                  { title: "Impressões", val: FORMATTERS.number(data.metrics.marketingMetrics.impressions), icon: <ReachIcon size={14} />, meta: "Visualizações" },
                  { title: "Frequência", val: data.metrics.marketingMetrics.frequency.toFixed(2), icon: <RefreshCw size={14} />, meta: scaledGoals.frequency.toFixed(1), status: statusMap.frequency },
                  { title: "CPM", val: FORMATTERS.currency(data.metrics.marketingMetrics.cpm), icon: <Percent size={14} />, meta: FORMATTERS.currency(scaledGoals.cpm), status: statusMap.cpm }
                ].map((kpi, idx) => (
                  <div key={idx} className="px-8 py-6 group hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-primary opacity-60 group-hover:opacity-100 transition-opacity">{kpi.icon}</div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{kpi.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-slate-800 dark:text-white italic tracking-tighter leading-none">{kpi.val}</span>
                      {kpi.status && <StatusBadge status={kpi.status} />}
                    </div>
                    <div className="mt-2 text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase italic">Meta: {kpi.meta}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-5 divide-x divide-slate-100 dark:divide-slate-700">
                {[
                  { title: "Cliques", val: FORMATTERS.number(data.metrics.marketingMetrics.clicks), icon: <MousePointer2 size={14} />, meta: "Cliques no Link" },
                  { title: "CPC", val: FORMATTERS.currency(data.metrics.marketingMetrics.cpc), icon: <DollarSign size={14} />, meta: "Custo Médio" },
                  { title: "CTR", val: FORMATTERS.percent(data.metrics.marketingMetrics.ctr), icon: <Percent size={14} />, meta: FORMATTERS.percent(scaledGoals.ctr), status: statusMap.ctr },
                  { title: "Leads (Plataforma)", val: FORMATTERS.number(data.metrics.marketingMetrics.cpl > 0 ? data.metrics.totalSpend / data.metrics.marketingMetrics.cpl : 0), icon: <Users size={14} />, meta: "Atribuídos" },
                  { title: "CPL", val: FORMATTERS.currency(data.metrics.marketingMetrics.cpl), icon: <CplIcon size={14} />, meta: FORMATTERS.currency(scaledGoals.cpl), status: statusMap.cpl }
                ].map((kpi, idx) => (
                  <div key={idx} className="px-8 py-6 group hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-primary opacity-60 group-hover:opacity-100 transition-opacity">{kpi.icon}</div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{kpi.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-slate-800 dark:text-white italic tracking-tighter leading-none">{kpi.val}</span>
                      {kpi.status && <StatusBadge status={kpi.status} />}
                    </div>
                    <div className="mt-2 text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase italic">Meta: {kpi.meta}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-12 rounded-[40px] border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12"><VerticalBarIcon size={300} /></div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 relative z-10">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-primary/10 rounded-2xl text-primary shadow-inner"><Video size={36} /></div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter leading-none mb-2">Monitor de Retenção de Vídeo</h3>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] italic">Análise técnica de queda de audiência por marcos de visualização</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-inner">
                  {['3s', '25%', '50%', '75%', '100%'].map((m, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5 px-3 border-r last:border-none border-slate-200 dark:border-slate-800">
                      <div className={`w-6 h-1.5 rounded-full ${i === 0 ? 'bg-primary/20' : i === 4 ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-primary/50'}`}></div>
                      <span className="text-[8px] font-black text-slate-400 uppercase">{m}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 relative z-10">
                {data.creativePlayback.length > 0 ? data.creativePlayback.slice(0, 9).map((creative, index) => {
                  const maxVal = creative.views3s || 1;
                  const milestones = [
                    { label: '3s', value: creative.views3s, percent: 100 },
                    { label: '25%', value: creative.p25, percent: (creative.p25 / maxVal) * 100 },
                    { label: '50%', value: creative.p50, percent: (creative.p50 / maxVal) * 100 },
                    { label: '75%', value: creative.p75, percent: (creative.p75 / maxVal) * 100 },
                    { label: '100%', value: creative.p100, percent: (creative.p100 / maxVal) * 100 }
                  ];

                  return (
                    <div key={index} className="bg-slate-50 dark:bg-slate-900/40 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 flex flex-col hover:bg-white dark:hover:bg-slate-900 hover:shadow-lg transition-all group min-h-[420px]">
                      <div className="flex items-start justify-between mb-10">
                        <div className="max-w-[70%]">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black italic shadow-lg">#{index + 1}</span>
                            <h4 className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase italic leading-tight group-hover:text-primary transition-colors line-clamp-1">{creative.adName}</h4>
                          </div>
                          <div className="flex flex-col gap-1">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{FORMATTERS.number(creative.views3s)} visualizações totais</p>
                            {creative.date && (
                              <div className="flex items-center gap-1.5 mt-1.5 opacity-60">
                                <Calendar size={10} className="text-primary" />
                                <p className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase italic tracking-tighter">Ativo em: {creative.date}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-black text-primary uppercase italic tracking-widest">Retenção Final</span>
                          <p className="text-3xl font-black text-primary italic leading-none">{creative.retentionRate.toFixed(1)}%</p>
                        </div>
                      </div>

                      <div className="flex-1 flex items-end justify-between h-44 gap-3 px-2 mb-6 relative">
                        <div className="absolute inset-x-0 top-0 h-full flex flex-col justify-between pointer-events-none opacity-5">
                          {[...Array(5)].map((_, i) => <div key={i} className="w-full h-px bg-slate-400"></div>)}
                        </div>
                        {milestones.map((m, mIdx) => (
                          <div key={mIdx} className="flex-1 flex flex-col items-center justify-end h-full relative group/bar">
                            <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-12 bg-slate-900 text-white text-[10px] px-3 py-1.5 rounded-xl font-black shadow-2xl z-30 transition-all scale-75 group-hover/bar:scale-100 whitespace-nowrap">
                              {FORMATTERS.number(m.value)}
                            </div>
                            <div
                              className={`w-full rounded-t-xl transition-all duration-1000 ease-out shadow-sm ${mIdx === 0 ? 'bg-primary/10' : mIdx === milestones.length - 1 ? 'bg-primary' : 'bg-primary/50'}`}
                              style={{ height: `${Math.max(m.percent, 8)}%` }}
                            />
                            <span className="mt-4 text-[9px] font-black text-slate-400 uppercase italic tracking-tighter">{m.label}</span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity size={14} className="text-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">Concluíram o vídeo</span>
                        </div>
                        <span className="text-sm font-black text-slate-800 dark:text-white italic">{FORMATTERS.number(creative.p100)}</span>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="col-span-full py-40 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[40px]">
                    <Video size={64} className="mx-auto text-slate-200 mb-8" />
                    <p className="text-slate-400 font-black italic uppercase text-lg tracking-widest">Aguardando dados para compilação visual</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-12 rounded-[40px] border border-slate-200 dark:border-slate-700 shadow-sm mt-8">
              <div className="flex items-center justify-between mb-12 px-4">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-primary/10 rounded-2xl text-primary"><Award size={32} /></div>
                  <div><h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter leading-none mb-1">Ranking de Performance por Criativo</h3><p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Análise Qualitativa: Leads &gt; CPL &gt; CTR</p></div>
                </div>
              </div>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50">
                      <th className="py-6 px-10 rounded-tl-3xl text-[10px] font-black text-slate-400 uppercase italic tracking-widest border-b border-slate-200 dark:border-slate-800">Origem & Peça Publicitária</th>
                      <th className="py-6 px-6 text-[10px] font-black text-slate-400 uppercase italic tracking-widest border-b border-slate-200 dark:border-slate-800 text-center">Leads</th>
                      <th className="py-6 px-6 text-[10px] font-black text-slate-400 uppercase italic tracking-widest border-b border-slate-200 dark:border-slate-800 text-center">Investimento</th>
                      <th className="py-6 px-6 text-[10px] font-black text-slate-400 uppercase italic tracking-widest border-b border-slate-200 dark:border-slate-800 text-center">CPL</th>
                      <th className="py-6 px-6 text-[10px] font-black text-slate-400 uppercase italic tracking-widest border-b border-slate-200 dark:border-slate-800 text-center">CTR</th>
                      <th className="py-6 px-10 rounded-tr-3xl text-[10px] font-black text-slate-400 uppercase italic tracking-widest border-b border-slate-200 dark:border-slate-800 text-right">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adRankingData.length > 0 ? adRankingData.map((item, index) => {
                      const cplStatus = calculateStatus(item.cpl, scaledGoals.cpl, 'lower-better');
                      const ctrStatus = calculateStatus(item.ctr, scaledGoals.ctr, 'higher-better');
                      const isTopWinner = index === 0 && item.leads > 0;
                      return (
                        <tr key={index} className="group hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all border-b border-slate-100 dark:border-slate-800/50 last:border-none">
                          <td className="py-6 px-10">
                            <p className="text-[10px] font-black text-primary uppercase italic truncate max-w-[220px] mb-1">{item.campaign}</p>
                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 italic line-clamp-1">{item.ad}</p>
                          </td>
                          <td className="py-6 px-6 text-center"><span className="text-base font-black text-slate-900 dark:text-white italic">{FORMATTERS.number(item.leads)}</span></td>
                          <td className="py-6 px-6 text-center"><span className="text-xs font-bold text-slate-500">{FORMATTERS.currency(item.spend)}</span></td>
                          <td className="py-6 px-6 text-center"><div className="flex flex-col items-center gap-1.5"><span className={`text-xs font-black italic ${item.cpl <= scaledGoals.cpl ? 'text-emerald-500' : 'text-slate-500'}`}>{FORMATTERS.currency(item.cpl)}</span><StatusBadge status={cplStatus} /></div></td>
                          <td className="py-6 px-6 text-center"><div className="flex flex-col items-center gap-1.5"><span className="text-xs font-bold text-slate-600 dark:text-slate-300">{FORMATTERS.percent(item.ctr)}</span><StatusBadge status={ctrStatus} /></div></td>
                          <td className="py-6 px-10 text-right">{isTopWinner ? (<div className="inline-flex items-center gap-2 bg-emerald-500 px-5 py-2.5 rounded-2xl shadow-lg shadow-emerald-500/20"><Trophy size={16} className="text-white" /><span className="text-[10px] font-black text-white uppercase italic tracking-widest">CAMPEÃO</span></div>) : index < 3 && item.leads > 0 ? (<div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl"><Star size={14} className="text-primary fill-primary" /><span className="text-[9px] font-black text-primary uppercase italic">TOP {index + 1}</span></div>) : (<div className="inline-flex px-3 py-1 rounded-xl text-[9px] font-black uppercase italic text-slate-400 border border-slate-200 dark:border-slate-700">NORMAL</div>)}</td>
                        </tr>
                      );
                    }) : (<tr><td colSpan={6} className="py-40 text-center"><Database size={48} className="mx-auto text-slate-200 mb-6" /><p className="text-xs font-black text-slate-400 uppercase italic tracking-widest opacity-60">Aguardando dados para gerar o ranking</p></td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className={`space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10 transition-opacity ${isFiltering ? 'opacity-50' : 'opacity-100'}`}>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-8 shadow-sm"><div className="relative flex-1"><Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} /><input type="text" placeholder="Buscar cliente por nome ou dado..." className="w-full pl-16 pr-8 py-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none dark:text-white transition-all focus:ring-2 focus:ring-primary/20 shadow-inner italic" value={salesSearch} onChange={(e) => setSalesSearch(e.target.value)} /></div><div className="relative min-w-[340px]"><select className="w-full px-10 py-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[12px] font-black uppercase italic tracking-widest outline-none dark:text-white cursor-pointer appearance-none shadow-sm" value={selectedStage} onChange={(e) => setSelectedStage(e.target.value)}><option value="all">Todas as Etapas</option>{orderedStages.map(s => <option key={s} value={s}>{s}</option>)}</select><ChevronRight size={20} className="absolute right-8 top-1/2 -translate-y-1/2 rotate-90 text-primary pointer-events-none" /></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{filteredLeads.length > 0 ? filteredLeads.map((lead) => (<div key={lead.id} className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 flex flex-col hover:shadow-lg hover:-translate-y-2 transition-all group cursor-pointer shadow-sm relative overflow-hidden">{lead.stage.toLowerCase().includes('concluid') && (<div className="absolute top-0 right-0 p-4 bg-emerald-500 text-white rounded-bl-3xl shadow-lg"><ShoppingBag size={16} /></div>)}<div className="flex items-center gap-5 mb-6"><div className="w-16 h-16 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black group-hover:bg-primary group-hover:text-white transition-all italic text-2xl shadow-inner">{lead.name.charAt(0).toUpperCase()}</div><div><h4 className="font-black text-slate-800 dark:text-white italic text-lg leading-tight group-hover:text-primary transition-colors">{lead.name}</h4><p className="text-[11px] font-bold text-slate-400 uppercase italic mt-2 tracking-widest">{lead.stage}</p></div></div><div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800"><div className="flex items-center gap-4 text-[11px] font-bold text-slate-500"><Mail size={14} className="text-primary" /> <span className="truncate">{lead.email}</span></div><div className="flex items-center gap-4 text-[11px] font-bold text-slate-500"><Phone size={14} className="text-emerald-500" /> {lead.phone}</div></div></div>)) : (<div className="col-span-full py-40 text-center bg-white dark:bg-slate-800 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-sm"><Database size={64} className="mx-auto text-slate-200 mb-8" /><p className="text-slate-400 font-black italic uppercase text-lg tracking-widest">Nenhum registro encontrado</p></div>)}</div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
