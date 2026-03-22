/**
 * Belysium Group Chatbot Widget
 * Vanilla TypeScript — compiled to a single IIFE for Squarespace Code Injection.
 *
 * Usage (Squarespace Settings > Advanced > Code Injection > Header):
 *   <script>
 *     window.BelysiumWidgetConfig = {
 *       apiUrl: 'https://api.belysiumgroup.com',
 *       division: 'professional',  // or 'developments'
 *       primaryColor: '#1a1a2e',
 *       accentColor: '#c9a84c'
 *     };
 *   </script>
 *   <script src="https://[your-cdn]/belysium-widget.iife.js" defer></script>
 */

interface WidgetConfig {
  apiUrl: string;
  division: 'professional' | 'developments' | 'general';
  primaryColor?: string;
  accentColor?: string;
  position?: 'bottom-right' | 'bottom-left';
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface LeadInfo {
  name: string;
  email: string;
  company?: string;
}

const DEFAULT_CONFIG: Partial<WidgetConfig> = {
  primaryColor: '#1a1a2e',
  accentColor: '#c9a84c',
  position: 'bottom-right',
};

const GREETINGS: Record<string, string> = {
  professional:
    'Hello! I\'m the Belysium Professional advisor. How can I help you today — are you looking to improve profitability, streamline operations, or plan a strategic transformation?',
  developments:
    'Welkom! I\'m the Belysium Developments assistant. Are you interested in our Li\'Eau apartments in Herselt, or do you have questions about buying property in Belgium?',
  general:
    'Hello! Welcome to Belysium Group. How can I direct your inquiry today?',
};

const LEAD_PROMPT_TRIGGER = 3; // Ask for lead info after this many exchanges

class BelysiumWidget {
  private config: WidgetConfig;
  private messages: Message[] = [];
  private sessionId: string | null = null;
  private leadCaptured = false;
  private exchangeCount = 0;
  private isOpen = false;
  private isTyping = false;

  // DOM elements
  private container!: HTMLElement;
  private bubble!: HTMLElement;
  private panel!: HTMLElement;
  private messagesEl!: HTMLElement;
  private inputEl!: HTMLInputElement;
  private sendBtn!: HTMLButtonElement;

  constructor(config: WidgetConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config } as WidgetConfig;
    this.injectStyles();
    this.render();
    this.showGreeting();
  }

  private injectStyles() {
    const { primaryColor, accentColor, position } = this.config;
    const side = position === 'bottom-left' ? 'left: 24px;' : 'right: 24px;';

    const style = document.createElement('style');
    style.textContent = `
      #bly-widget-container * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      #bly-widget-container { position: fixed; bottom: 24px; ${side} z-index: 99999; }
      #bly-bubble {
        width: 56px; height: 56px; border-radius: 50%;
        background: ${primaryColor}; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 16px rgba(0,0,0,0.25);
        transition: transform 0.2s;
      }
      #bly-bubble:hover { transform: scale(1.08); }
      #bly-bubble svg { width: 28px; height: 28px; fill: #fff; }
      #bly-unread {
        position: absolute; top: -2px; right: -2px;
        background: ${accentColor}; color: #fff;
        border-radius: 50%; width: 18px; height: 18px;
        font-size: 11px; font-weight: 700;
        display: flex; align-items: center; justify-content: center;
        display: none;
      }
      #bly-panel {
        position: absolute; bottom: 68px; right: 0;
        width: 360px; max-width: calc(100vw - 32px);
        background: #fff; border-radius: 16px;
        box-shadow: 0 8px 40px rgba(0,0,0,0.18);
        display: none; flex-direction: column; overflow: hidden;
        max-height: 540px;
      }
      #bly-panel.open { display: flex; }
      #bly-header {
        background: ${primaryColor}; color: #fff;
        padding: 16px 18px; display: flex; align-items: center; gap: 10px;
      }
      #bly-header-avatar {
        width: 36px; height: 36px; border-radius: 50%;
        background: ${accentColor}; display: flex; align-items: center; justify-content: center;
        font-weight: 700; font-size: 14px; color: #fff; flex-shrink: 0;
      }
      #bly-header-info { flex: 1; }
      #bly-header-name { font-weight: 600; font-size: 14px; }
      #bly-header-status { font-size: 12px; opacity: 0.75; }
      #bly-close { background: none; border: none; color: #fff; cursor: pointer; padding: 4px; opacity: 0.7; }
      #bly-close:hover { opacity: 1; }
      #bly-messages {
        flex: 1; overflow-y: auto; padding: 16px;
        display: flex; flex-direction: column; gap: 10px;
        scroll-behavior: smooth;
      }
      .bly-msg {
        max-width: 85%; padding: 10px 14px; border-radius: 14px;
        font-size: 13.5px; line-height: 1.5;
        animation: blyFadeIn 0.2s ease;
      }
      @keyframes blyFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      .bly-msg-user {
        align-self: flex-end;
        background: ${primaryColor}; color: #fff;
        border-bottom-right-radius: 4px;
      }
      .bly-msg-assistant {
        align-self: flex-start;
        background: #f1f3f5; color: #1a1a2e;
        border-bottom-left-radius: 4px;
      }
      .bly-typing {
        align-self: flex-start; background: #f1f3f5;
        padding: 12px 16px; border-radius: 14px; border-bottom-left-radius: 4px;
      }
      .bly-typing span {
        display: inline-block; width: 6px; height: 6px;
        background: #888; border-radius: 50%; margin: 0 1px;
        animation: blyBounce 1.2s infinite;
      }
      .bly-typing span:nth-child(2) { animation-delay: 0.2s; }
      .bly-typing span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes blyBounce { 0%,80%,100% { transform: scale(0.8); opacity: 0.5; } 40% { transform: scale(1.2); opacity: 1; } }
      #bly-lead-form {
        background: #f8f9fa; border-top: 1px solid #e9ecef;
        padding: 14px 16px;
      }
      #bly-lead-form p { font-size: 12.5px; color: #555; margin: 0 0 10px; }
      #bly-lead-form input {
        width: 100%; padding: 8px 12px; margin-bottom: 8px;
        border: 1px solid #dee2e6; border-radius: 8px;
        font-size: 13px; outline: none;
      }
      #bly-lead-form input:focus { border-color: ${primaryColor}; }
      #bly-lead-submit {
        width: 100%; padding: 9px; background: ${primaryColor}; color: #fff;
        border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600;
      }
      #bly-lead-submit:hover { opacity: 0.9; }
      #bly-input-area {
        display: flex; gap: 8px; padding: 12px 14px;
        border-top: 1px solid #e9ecef; align-items: flex-end;
      }
      #bly-input {
        flex: 1; border: 1px solid #dee2e6; border-radius: 20px;
        padding: 9px 14px; font-size: 13.5px; outline: none; resize: none;
        max-height: 80px; line-height: 1.4;
      }
      #bly-input:focus { border-color: ${primaryColor}; }
      #bly-send {
        width: 36px; height: 36px; border-radius: 50%;
        background: ${primaryColor}; border: none; cursor: pointer;
        display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      }
      #bly-send:hover { opacity: 0.85; }
      #bly-send svg { width: 16px; height: 16px; fill: #fff; }
      #bly-send:disabled { opacity: 0.4; cursor: not-allowed; }
      #bly-footer { text-align: center; padding: 6px; font-size: 10px; color: #aaa; }
      #bly-footer a { color: #aaa; text-decoration: none; }
    `;
    document.head.appendChild(style);
  }

  private render() {
    this.container = document.createElement('div');
    this.container.id = 'bly-widget-container';
    this.container.innerHTML = `
      <div id="bly-panel">
        <div id="bly-header">
          <div id="bly-header-avatar">BG</div>
          <div id="bly-header-info">
            <div id="bly-header-name">Belysium Assistant</div>
            <div id="bly-header-status">● Online</div>
          </div>
          <button id="bly-close" aria-label="Close chat">✕</button>
        </div>
        <div id="bly-messages"></div>
        <div id="bly-input-area">
          <input id="bly-input" type="text" placeholder="Type your message…" autocomplete="off" maxlength="500" />
          <button id="bly-send" aria-label="Send">
            <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
          </button>
        </div>
        <div id="bly-footer"><a href="https://belysiumgroup.com" target="_blank">Belysium Group</a></div>
      </div>
      <div id="bly-bubble" role="button" aria-label="Open chat" tabindex="0">
        <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        <div id="bly-unread">1</div>
      </div>
    `;
    document.body.appendChild(this.container);

    this.panel = this.container.querySelector('#bly-panel')!;
    this.messagesEl = this.container.querySelector('#bly-messages')!;
    this.inputEl = this.container.querySelector('#bly-input')!;
    this.sendBtn = this.container.querySelector('#bly-send')!;
    const bubble = this.container.querySelector('#bly-bubble')!;
    const closeBtn = this.container.querySelector('#bly-close')!;

    bubble.addEventListener('click', () => this.togglePanel());
    bubble.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Enter') this.togglePanel(); });
    closeBtn.addEventListener('click', () => this.closePanel());
    this.sendBtn.addEventListener('click', () => this.handleSend());
    this.inputEl.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Enter' && !(e as KeyboardEvent).shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });
  }

  private togglePanel() {
    this.isOpen ? this.closePanel() : this.openPanel();
  }

  private openPanel() {
    this.isOpen = true;
    this.panel.classList.add('open');
    // Hide unread badge
    (this.container.querySelector('#bly-unread') as HTMLElement).style.display = 'none';
    this.inputEl.focus();
  }

  private closePanel() {
    this.isOpen = false;
    this.panel.classList.remove('open');
  }

  private showGreeting() {
    const greeting = GREETINGS[this.config.division] ?? GREETINGS.general;
    // Show unread badge after 3s to encourage opening
    setTimeout(() => {
      (this.container.querySelector('#bly-unread') as HTMLElement).style.display = 'flex';
    }, 3000);
    this.addMessage('assistant', greeting, false);
    this.messages.push({ role: 'assistant', content: greeting });
  }

  private addMessage(role: 'user' | 'assistant', content: string, animate = true): HTMLElement {
    const el = document.createElement('div');
    el.className = `bly-msg bly-msg-${role}`;
    el.textContent = content;
    if (!animate) el.style.animation = 'none';
    this.messagesEl.appendChild(el);
    this.scrollToBottom();
    return el;
  }

  private showTyping(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'bly-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    this.messagesEl.appendChild(el);
    this.scrollToBottom();
    return el;
  }

  private scrollToBottom() {
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  private async handleSend() {
    const text = this.inputEl.value.trim();
    if (!text || this.isTyping) return;

    this.inputEl.value = '';
    this.addMessage('user', text);
    this.messages.push({ role: 'user', content: text });
    this.exchangeCount++;

    this.isTyping = true;
    this.sendBtn.disabled = true;
    const typingEl = this.showTyping();

    // After N exchanges, show lead form instead of continuing
    if (!this.leadCaptured && this.exchangeCount >= LEAD_PROMPT_TRIGGER) {
      typingEl.remove();
      this.isTyping = false;
      this.sendBtn.disabled = false;
      this.showLeadForm();
      return;
    }

    try {
      const assistantEl = document.createElement('div');
      assistantEl.className = 'bly-msg bly-msg-assistant';
      let responseText = '';
      let firstToken = true;

      const response = await fetch(`${this.config.apiUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          division: this.config.division,
          messages: this.messages,
        }),
      });

      if (response.headers.get('X-Session-Id')) {
        this.sessionId = response.headers.get('X-Session-Id');
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'token') {
              if (firstToken) {
                typingEl.remove();
                this.messagesEl.appendChild(assistantEl);
                firstToken = false;
              }
              responseText += data.text;
              assistantEl.textContent = responseText;
              this.scrollToBottom();
            } else if (data.type === 'done') {
              this.sessionId = data.sessionId ?? this.sessionId;
            }
          } catch {}
        }
      }

      this.messages.push({ role: 'assistant', content: responseText });
    } catch (err) {
      typingEl.remove();
      this.addMessage('assistant', 'I\'m having trouble connecting right now. Please try again or email Info@BelysiumGroup.com directly.');
    } finally {
      this.isTyping = false;
      this.sendBtn.disabled = false;
    }
  }

  private showLeadForm() {
    // Remove existing form if any
    const existing = this.container.querySelector('#bly-lead-form');
    if (existing) return;

    const form = document.createElement('div');
    form.id = 'bly-lead-form';
    form.innerHTML = `
      <p>To continue our conversation, please share your contact details and a consultant will follow up:</p>
      <input id="bly-lead-name" type="text" placeholder="Your name *" required />
      <input id="bly-lead-email" type="email" placeholder="Email address *" required />
      <input id="bly-lead-company" type="text" placeholder="Company (optional)" />
      <button id="bly-lead-submit">Continue conversation →</button>
    `;

    // Insert before input area
    const inputArea = this.container.querySelector('#bly-input-area')!;
    this.panel.insertBefore(form, inputArea);

    this.container.querySelector('#bly-lead-submit')!.addEventListener('click', () => {
      this.submitLeadForm(form);
    });
  }

  private async submitLeadForm(formEl: HTMLElement) {
    const name = (formEl.querySelector('#bly-lead-name') as HTMLInputElement).value.trim();
    const email = (formEl.querySelector('#bly-lead-email') as HTMLInputElement).value.trim();
    const company = (formEl.querySelector('#bly-lead-company') as HTMLInputElement).value.trim();

    if (!name || !email || !email.includes('@')) {
      alert('Please enter your name and a valid email address.');
      return;
    }

    formEl.remove();
    this.leadCaptured = true;
    this.addMessage('assistant', `Thank you, ${name}! I've passed your details to our team. Let's continue — what would you like to know more about?`);
    this.messages.push({ role: 'assistant', content: `Thank you ${name}, noted.` });

    // Re-send last user message with lead info attached
    const lastUserMsg = [...this.messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      try {
        await fetch(`${this.config.apiUrl}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: this.sessionId,
            division: this.config.division,
            messages: this.messages,
            leadInfo: { name, email, company: company || undefined },
          }),
        });
      } catch {}
    }
  }
}

// ── Auto-init ─────────────────────────────────────────────────────────────────
function init() {
  const cfg = (window as any).BelysiumWidgetConfig as WidgetConfig | undefined;
  if (!cfg?.apiUrl) {
    console.warn('[Belysium Widget] No BelysiumWidgetConfig found. Set window.BelysiumWidgetConfig before loading the widget.');
    return;
  }
  new BelysiumWidget(cfg);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
