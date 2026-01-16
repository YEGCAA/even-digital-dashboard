
import { FunnelStage } from './types';

// The URL provided by the user.
export const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSo84LG3oGUNkjxVo8AK1A2zQPhahT7lPlgIBMBn1x1Pu8pGjHP7HtVr9G0DrsggqpEfWJDVxjWbV0u/pub?output=csv';

export const ASSETS = {
  LOGO: 'https://i.ibb.co/gZcFGqVt/Brand-03.png',
};

export const FUNNEL_STAGES_CONFIG: Omit<FunnelStage, 'count'>[] = [
  { stage: 'Entrada do lead', color: '#3B82F6' },
  { stage: 'Qualificado', color: '#2563EB' },
  { stage: 'Mensagem inicial', color: '#1D4ED8' },
  { stage: 'Tentativa de contato', color: '#1E40AF' },
  { stage: 'Em atendimento', color: '#1E3A8A' },
  { stage: 'Lead futuro', color: '#6B7280' },
  { stage: 'Pré agendamento', color: '#F59E0B' },
  { stage: 'Reunião agendada', color: '#F59E0B' },
  { stage: 'Reunião realizada', color: '#10B981' },
  { stage: 'Proposta enviada', color: '#10B981' },
  { stage: 'Vendas concluídas', color: '#10B981' },
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
