
(function () {
    // --- STYLES ---
    const styles = `
        .chat-message { padding: 12px 16px; margin: 8px 0; border-radius: 12px; max-width: 80%; word-wrap: break-word; font-size: 14px; line-height: 1.5; }
        .chat-message.user { background: linear-gradient(135deg, #854fff, #6b3fd4); color: white; align-self: flex-end; }
        .chat-message.bot { background: #f9f9f9; border: 1px solid #ccc; color: #333; align-self: flex-start; }
        .chat-messages { flex: 1; overflow-y: auto; padding: 20px; background: #fff; display: flex; flex-direction: column; }
        .chat-input { padding: 16px; border-top: 1px solid #eee; display: flex; gap: 8px; background: white; }
        .chat-input textarea { flex: 1; padding: 12px; border: 1px solid #ccc; border-radius: 8px; resize: none; font-size: 14px; }
        .chat-input button { background: #854fff; color: white; border: none; padding: 0 16px; border-radius: 8px; cursor: pointer; }
        .chat-interface { display: none; flex-direction: column; height: 100%; }
        .chat-interface.active { display: flex; }
        .chat-container { position: fixed; bottom: 20px; right: 20px; width: 360px; height: 540px; background: white; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); overflow: hidden; display: none; flex-direction: column; z-index: 1000; }
        .chat-container.open { display: flex; }
        .chat-toggle { position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; border-radius: 30px; background: #854fff; color: white; border: none; cursor: pointer; z-index: 999; font-size: 24px; }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // --- CONFIG ---
    const config = {
        webhook: {
            url: 'https://ymmcourse.app.n8n.cloud/webhook/a889d2ae-2159-402f-b326-5f61e90f602e/chat',
            route: 'general'
        }
    };

    let currentSessionId = '';

    // --- DOM ELEMENTS ---
    const widgetContainer = document.createElement('div');
    const chatContainer = document.createElement('div');
    chatContainer.className = 'chat-container';

    chatContainer.innerHTML = `
        <div class="chat-interface">
            <div class="chat-messages"></div>
            <div class="chat-input">
                <textarea placeholder="Type your message here..."></textarea>
                <button type="submit">Send</button>
            </div>
        </div>
    `;

    const toggleButton = document.createElement('button');
    toggleButton.className = 'chat-toggle';
    toggleButton.textContent = '💬';

    widgetContainer.appendChild(chatContainer);
    widgetContainer.appendChild(toggleButton);
    document.body.appendChild(widgetContainer);

    const chatInterface = chatContainer.querySelector('.chat-interface');
    const messagesContainer = chatContainer.querySelector('.chat-messages');
    const textarea = chatContainer.querySelector('textarea');
    const sendButton = chatContainer.querySelector('button');

    // --- FUNCTIONS ---
    function generateUUID() {
        return crypto.randomUUID();
    }

    function showStaticWelcomeMessage() {
        const botMessageDiv = document.createElement('div');
        botMessageDiv.className = 'chat-message bot';
        botMessageDiv.textContent = "Hi! How can I assist with your financial questions today?";
        messagesContainer.appendChild(botMessageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async function sendMessage(message) {
        if (!currentSessionId) currentSessionId = generateUUID();

        const userMessageDiv = document.createElement('div');
        userMessageDiv.className = 'chat-message user';
        userMessageDiv.textContent = message;
        messagesContainer.appendChild(userMessageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        try {
            const response = await fetch(config.webhook.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: "sendMessage",
                    sessionId: currentSessionId,
                    route: config.webhook.route,
                    chatInput: message,
                    metadata: { userId: "" }
                })
            });

            const data = await response.json();
            const reply = Array.isArray(data) ? data[0].output : data.output;

            const botMessageDiv = document.createElement('div');
            botMessageDiv.className = 'chat-message bot';
            botMessageDiv.textContent = reply;
            messagesContainer.appendChild(botMessageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

        } catch (error) {
            console.error('Message send failed:', error);
        }
    }

    // --- EVENTS ---
    toggleButton.addEventListener('click', () => {
        const isOpen = chatContainer.classList.toggle('open');
        if (isOpen) {
            chatInterface.classList.add('active');
            messagesContainer.innerHTML = ''; // clear previous
            showStaticWelcomeMessage();
            currentSessionId = generateUUID();
        }
    });

    sendButton.addEventListener('click', () => {
        const message = textarea.value.trim();
        if (message) {
            sendMessage(message);
            textarea.value = '';
        }
    });

    textarea.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const message = textarea.value.trim();
            if (message) {
                sendMessage(message);
                textarea.value = '';
            }
        }
    });
})();
