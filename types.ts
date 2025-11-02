export enum InstanceStatus {
  ONLINE = 'Online',
  OFFLINE = 'Offline',
  CONNECTING = 'Conectando',
  ERROR = 'Erro',
}

export interface WebhookConfig {
  enabled: boolean;
  url: string; // URL primária, se houver
  urls: string[]; // Suporte para múltiplas URLs
}

export interface ChatwootConfig {
  enabled: boolean;
  url: string;
  token: string;
  accountId: string;
  inboxId: string;
  // --- Fields for inbox creation and behavior ---
  inboxName?: string;
  companyName?: string; // Organização
  companyLogo?: string; // Logo
  conversationPending?: boolean; // Conversação Pendente
  reopenConversation?: boolean; // Reabrir conversa
  importContacts?: boolean;
  importMessages?: boolean;
  daysToImport?: number;
  ignorePhoneNumbers?: string[]; // Ignorar JIDs
  autoCreateInbox?: boolean; // Criação Automatica
  signMessages?: boolean;
  signatureDelimiter?: string;
}

export interface OpenAIConfig {
  enabled: boolean;
  apiKey: string;
  model: string;
  prompt: string;
}

export interface GeminiConfig {
  enabled: boolean;
  apiKey: string;
  model: string;
  prompt: string;
}

export interface Instance {
  id: string;
  name:string;
  status: InstanceStatus;
  url?: string;
  apiKey?: string;
  version?: string;
  channels?: string[];
  createdAt?: string;
  owner?: string;
  phoneNumber?: string;
  // Novas configurações de integração
  webhookConfig?: WebhookConfig;
  chatwootConfig?: ChatwootConfig;
  openAIConfig?: OpenAIConfig;
  geminiConfig?: GeminiConfig;
}

export interface Plan {
  id: string;
  name: string;
  maxInstances: number;
  price: number;
}

export interface Client {
  id: string;
  name: string;
  plan: Plan;
  instances: Instance[];
}

export interface DashboardStats {
  totalInstances: number;
  onlineInstances: number;

  messagesSent: number;
  webhooksTriggered: number;
}

export interface Webhook {
    id: string;
    url: string;
    events: string[];
    instanceId: string | 'global';
    enabled: boolean;
}

export type ViewType = 'dashboard' | 'instances' | 'integrations' | 'plans' | 'settings' | 'system-check' | 'api-keys' | 'crm' | 'vendas' | 'ai-agents' | 'contacts' | 'calendar' | 'instagram' | 'whatsapp';

export type Role = 'superadmin' | 'client';

export interface User {
    name: string;
    role: Role;
    // O plano é opcional, pois um superadmin não possui um.
    plan?: Plan;
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
  details?: string;
}

// --- NOVOS TIPOS PARA API DO CHATWOOT ---

export interface ChatwootContact {
    id: number;
    name: string;
    email: string | null;
    phone_number: string | null;
    thumbnail: string;
}

export interface ChatwootConversation {
    id: number;
    meta: {
        sender: ChatwootContact;
    };
    messages: ChatwootMessage[];
    last_activity_at: number; // timestamp
}

export interface ChatwootMessage {
    id: number;
    content: string;
    created_at: number; // timestamp
    message_type: 'incoming' | 'outgoing';
    private: boolean;
    sender?: {
        name: string;
        thumbnail: string;
    };
}

export interface GlobalChatwootSettings {
    apiUrl: string;
    apiToken: string;
    accountId: string;
}

export interface DebugLogEntry {
    id: number;
    timestamp: string;
    message: string;
    status: 'info' | 'success' | 'error';
    details?: string;
}

// --- NOVOS TIPOS PARA CHAVES DE API ---

export interface ApiKey {
  id: string;
  name: string;
  key: string; // A chave completa, disponível apenas na criação
  createdAt: string;
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  keyPrefix: string; // Chave parcial para exibição
  createdAt: string;
}