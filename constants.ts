
import { FunnelStage } from './types';

// The URL provided by the user.
export const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSo84LG3oGUNkjxVo8AK1A2zQPhahT7lPlgIBMBn1x1Pu8pGjHP7HtVr9G0DrsggqpEfWJDVxjWbV0u/pub?output=csv';

export const ASSETS = {
  LOGO: 'https://i.ibb.co/gZcFGqVt/Brand-03.png',
};

export const FUNNEL_STAGES_CONFIG: Omit<FunnelStage, 'count'>[] = [
  { stage: 'Entrada do lead', color: '#5992db' },
  { stage: 'Qualificado', color: '#4f83c8' },
  { stage: 'Mensagem inicial', color: '#4674b5' },
  { stage: 'Tentativa de contato', color: '#3c65a2' },
  { stage: 'Em atendimento', color: '#335690' },
  { stage: 'Lead futuro', color: '#2a487d' },
  { stage: 'Pré agendamento', color: '#20396a' },
  { stage: 'Reunião agendada', color: '#172a57' },
  { stage: 'Reunião realizada', color: '#0d1c45' },
  { stage: 'Proposta enviada', color: '#091533' },
  { stage: 'Vendas concluídas', color: '#10b981' },
];

export const FORMATTERS = {
  // Formato cheio para moeda
  currency: (value: number) => new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  }).format(value),
  
  // Formato cheio para números (inteiros ou com decimais se existirem)
  number: (value: number) => new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 0 // Assume valor inteiro para contagens como solicitado
  }).format(value),
  
  // Caso queira o número bruto com decimais (exemplo: 39 9998,8328328)
  raw: (value: number) => new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 7
  }).format(value),

  percent: (value: number) => new Intl.NumberFormat('pt-BR', { 
    style: 'percent', 
    minimumFractionDigits: 1, 
    maximumFractionDigits: 2 
  }).format(value / 100),
};
