import { google } from 'googleapis';

/**
 * Este arquivo contém funções assíncronas prontas (Node.js) para integração
 * com a API do Google Calendar, conforme solicitado na arquitetura existente.
 * 
 * NOTA: Para rodar estas funções no browser (React), você deverá expô-las
 * através do seu backend Node.js (ex: usando Express, Next.js API Routes, etc),
 * pois a biblioteca googleapis foi feita para rodar em ambiente servidor e
 * manter suas chaves (client_secret) seguras.
 */

// 1. Configuração do Cliente OAuth2
// Crie um projeto no Google Cloud Console, ative a Google Calendar API
// e crie credenciais OAuth 2.0. Substitua os valores abaixo ou utilize .env.
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID || "SEU_CLIENT_ID",
  process.env.GOOGLE_CLIENT_SECRET || "SEU_CLIENT_SECRET",
  process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/callback"
);

/**
 * Retorna a URL de autenticação para onde o usuário deve ser redirecionado.
 * Quando o usuário aprovar, o Google redirecionará para GOOGLE_REDIRECT_URI
 * com um parâmetro `code` na URL.
 */
export function getAuthUrl() {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline', // Necessário para receber um refresh_token
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    prompt: 'consent' // Garante que a tela de consentimento sempre apareça
  });
  return authUrl;
}

/**
 * Após o redirecionamento, pegue o `code` da URL e chame esta função
 * para obter os tokens e salvar no seu banco de dados atrelado ao usuário.
 */
export async function authenticateWithCode(code: string) {
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    
    // IMPORTANTE: Salve 'tokens.refresh_token' no seu banco de dados
    return tokens;
  } catch (error) {
    console.error("Erro ao autenticar com o código OAuth:", error);
    throw error;
  }
}

/**
 * Função utilitária para inicializar o cliente com tokens salvos.
 * Chame isso antes de fazer qualquer operação no calendário.
 */
export function setCredentials(tokens: any) {
  oAuth2Client.setCredentials(tokens);
}

const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

/**
 * CRIA UM NOVO EVENTO
 * @param eventData Dados da escala/evento (nome, data, turno)
 * @returns ID do evento no Google Calendar
 */
export async function createCalendarEvent(eventData: {
  nome: string;
  data: string; // Formato YYYY-MM-DD
  turno: string;
  funcao: string;
}) {
  try {
    // Definindo horários baseados no turno
    let startTime = "09:00:00";
    let endTime = "13:00:00";
    if (eventData.turno === "Tarde") {
      startTime = "13:00:00";
      endTime = "17:00:00";
    } else if (eventData.turno === "Integral") {
      startTime = "09:00:00";
      endTime = "17:00:00";
    }

    const event = {
      summary: `Escala: ${eventData.nome}`,
      description: `Função: ${eventData.funcao}\nTurno: ${eventData.turno}`,
      start: {
        dateTime: `${eventData.data}T${startTime}-03:00`,
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: `${eventData.data}T${endTime}-03:00`,
        timeZone: 'America/Sao_Paulo',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });
    
    // Retorne o ID para salvar no seu banco de dados
    return response.data.id;
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    throw error;
  }
}

/**
 * ATUALIZA UM EVENTO EXISTENTE
 * @param eventId ID do evento do Google retornado pela função createCalendarEvent
 * @param eventData Dados a serem atualizados
 */
export async function updateCalendarEvent(eventId: string, eventData: {
  nome: string;
  data: string;
  turno: string;
  funcao: string;
}) {
  try {
    let startTime = "09:00:00";
    let endTime = "13:00:00";
    if (eventData.turno === "Tarde") {
      startTime = "13:00:00";
      endTime = "17:00:00";
    } else if (eventData.turno === "Integral") {
      startTime = "09:00:00";
      endTime = "17:00:00";
    }

    const event = {
      summary: `Escala: ${eventData.nome}`,
      description: `Função: ${eventData.funcao}\nTurno: ${eventData.turno}`,
      start: {
        dateTime: `${eventData.data}T${startTime}-03:00`,
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: `${eventData.data}T${endTime}-03:00`,
        timeZone: 'America/Sao_Paulo',
      },
    };

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      requestBody: event,
    });

    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    throw error;
  }
}

/**
 * EXCLUI UM EVENTO
 * @param eventId ID do evento do Google
 */
export async function deleteCalendarEvent(eventId: string) {
  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });
    return true;
  } catch (error) {
    console.error('Erro ao deletar evento:', error);
    throw error;
  }
}
