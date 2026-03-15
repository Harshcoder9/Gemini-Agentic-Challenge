import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface LiveChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface UseLiveStockChatOptions {
  symbols: string[];
}

interface UseLiveStockChatResult {
  messages: LiveChatMessage[];
  loading: boolean;
  connected: boolean;
  error: string;
  sendMessage: (message: string) => void;
  interrupt: () => void;
  sendAudioChunk: (chunkBase64: string, mimeType: string) => void;
  commitAudio: (transcript?: string) => void;
  clearMessages: () => void;
}

const INITIAL_MESSAGE: LiveChatMessage = {
  id: 'assistant_welcome',
  role: 'assistant',
  content:
    'Hi! I am your AI assistant, highly knowledgeable about stock chart patterns and technical analysis. Ask me about any stock or chart pattern!',
};

function toWebSocketUrl(baseHttpUrl: string): string {
  const base = baseHttpUrl.replace(/\/$/, '').replace(/\/api$/, '');
  if (base.startsWith('https://')) {
    return `${base.replace('https://', 'wss://')}/api/live/session`;
  }
  if (base.startsWith('http://')) {
    return `${base.replace('http://', 'ws://')}/api/live/session`;
  }
  return `ws://${base}/api/live/session`;
}

export function useLiveStockChat({ symbols }: UseLiveStockChatOptions): UseLiveStockChatResult {
  const [messages, setMessages] = useState<LiveChatMessage[]>([INITIAL_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const streamingAssistantIdRef = useRef<string | null>(null);

  const wsUrl = useMemo(() => {
    const inferredBase =
      typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.hostname}:8000`
        : 'http://localhost:8000';
    const httpBase = process.env.NEXT_PUBLIC_API_URL ?? inferredBase;
    return toWebSocketUrl(httpBase);
  }, []);

  useEffect(() => {
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;
    console.log('[useLiveStockChat] WebSocket connecting to', wsUrl, 'with symbols:', symbols);

    socket.onopen = () => {
      console.log('[useLiveStockChat] WebSocket opened, sending init with symbols:', symbols);
      setConnected(true);
      setError('');
      socket.send(
        JSON.stringify({
          type: 'session.init',
          symbols,
        })
      );
    };

    socket.onclose = closeEvent => {
      console.log(
        '[useLiveStockChat] WebSocket closed with code:',
        closeEvent.code,
        'reason:',
        closeEvent.reason
      );
      setConnected(false);
      setLoading(false);
      if (closeEvent.code !== 1000) {
        setError(`Live connection closed (${closeEvent.code}).`);
      }
    };

    socket.onerror = () => {
      console.log('[useLiveStockChat] WebSocket error');
      setError('Live connection failed. Please retry in a moment.');
      setConnected(false);
      setLoading(false);
    };

    socket.onmessage = evt => {
      const event = JSON.parse(evt.data as string);
      const type = event.type as string;
      console.log('[useLiveStockChat] Message received:', type, event);

      if (type === 'session.ready') {
        // Backend is ready for messages
        console.log('[useLiveStockChat] Session ready');
        return;
      }

      if (type === 'assistant.start') {
        const assistantId = String(event.assistantId);
        streamingAssistantIdRef.current = assistantId;
        setMessages(prev => [
          ...prev,
          {
            id: assistantId,
            role: 'assistant',
            content: '',
          },
        ]);
        return;
      }

      if (type === 'assistant.chunk') {
        const assistantId = String(event.assistantId);
        const delta = String(event.delta ?? '');
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: `${msg.content}${delta}`,
                }
              : msg
          )
        );
        return;
      }

      if (type === 'assistant.done') {
        streamingAssistantIdRef.current = null;
        setLoading(false);
        return;
      }

      if (type === 'assistant.interrupted') {
        streamingAssistantIdRef.current = null;
        setLoading(false);
        return;
      }

      if (type === 'assistant.error') {
        setError(String(event.message ?? 'Live agent error.'));
        streamingAssistantIdRef.current = null;
        setLoading(false);
      }
    };

    return () => {
      socket.close();
      if (wsRef.current === socket) {
        wsRef.current = null;
      }
      setConnected(false);
      setLoading(false);
    };
  }, [symbols, wsUrl]);

  const sendMessage = useCallback((message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;

    console.log('[useLiveStockChat] sendMessage called with:', trimmed);
    console.log('[useLiveStockChat] socket state:', wsRef.current?.readyState);

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.log('[useLiveStockChat] Socket not ready, state:', wsRef.current?.readyState);
      setError('Live connection is not ready yet.');
      return;
    }

    console.log('[useLiveStockChat] Sending message to backend');
    setMessages(prev => [
      ...prev,
      {
        id: `user_${Date.now()}`,
        role: 'user',
        content: trimmed,
      },
    ]);

    setLoading(true);
    setError('');
    wsRef.current.send(
      JSON.stringify({
        type: 'user.message',
        message: trimmed,
      })
    );
  }, []);

  const interrupt = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (!streamingAssistantIdRef.current) return;

    wsRef.current.send(JSON.stringify({ type: 'user.interrupt' }));
    setLoading(false);
  }, []);

  const sendAudioChunk = useCallback((chunkBase64: string, mimeType: string) => {
    if (!chunkBase64) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(
      JSON.stringify({
        type: 'user.audio_chunk',
        chunk: chunkBase64,
        mimeType,
      })
    );
  }, []);

  const commitAudio = useCallback((transcript?: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('Live connection is not ready yet.');
      return;
    }

    wsRef.current.send(
      JSON.stringify({
        type: 'user.audio_commit',
        transcript: (transcript ?? '').trim(),
      })
    );

    if (transcript && transcript.trim()) {
      setMessages(prev => [
        ...prev,
        {
          id: `user_${Date.now()}`,
          role: 'user',
          content: transcript.trim(),
        },
      ]);
      setLoading(true);
      setError('');
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([INITIAL_MESSAGE]);
    setError('');
    
    // Also reset backend session state
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'session.init',
          symbols,
        })
      );
    }
  }, [symbols]);

  return {
    messages,
    loading,
    connected,
    error,
    sendMessage,
    interrupt,
    sendAudioChunk,
    commitAudio,
    clearMessages,
  };
}
