// Chat Widget Script
(function () {
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://cdn.jsdelivr.net/npm/geist@1.0.0/dist/fonts/geist-sans/style.css';
    document.head.appendChild(fontLink);

    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
    .chat-messages {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 10px;
        height: 200px;
        overflow-y: auto;
        background: #fff;
        border: 1px solid #ccc;
        border-radius: 6px;
    }

    .chat-message {
        padding: 10px;
        margin: 5px;
        border-radius: 6px;
        max-width: 80%;
        word-wrap: break-word;
    }

    .chat-message.user {
        background: #854fff;
        color: white;
        align-self: flex-end;
    }

    .chat-message.bot {
        background: #f2f2f2;
        color: black;
        align-self: flex-start;
    }
    `;
    document.head.appendChild(styleSheet);

    const defaultConfig = {
        webhook: { url: '', route: '' },
        branding: {
            logo: '',
            name: '',
            welcomeText: '',
            responseTimeText: '',
            poweredBy: { text: 'Powered by YMM', link: 'https://ymmcourse.com/' }
        },
        style: {
            primaryColor: '',
            secondaryColor: '',
            position: 'right',
            backgroundColor: '#ffffff',
            fontColor: '#333333'
        }
    };

    const config = window.ChatWidgetConfig ? {
        webhook: { ...defaultConfig.webhook, ...window.ChatWidgetConfig.webhook },
        branding: { ...defaultConfig.branding, ...window.ChatWidgetConfig.branding },
        style: { ...defaultConfig.style, ...window.ChatWidgetConfig.style }
    } : defaultConfig;

    if (window.N8NChatWidgetInitialized) return;
    window.N8NChatWidgetInitialized = true;

    let currentSessionId = '';
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'n8n-chat-widget';
    widgetContainer.style.setProperty('--n8n-chat-primary-color', config.style.primaryColor);
    widgetContainer.style.setProperty('--n8n-chat-secondary-color', config.style.secondaryColor);
    widgetContainer.style.setProperty('--n8n-chat-background-color', config.style.backgroundColor);
    widgetContainer.style.setProperty('--n8n-chat-font-color', config.style.fontColor);

    const chatContainer = document.createElement('div');
    chatContainer.className = `chat-container${config.style.position === 'left' ? ' position-left' : ''}`;

    const newConversationHTML = `
        <div class="brand-header">
            <img src="${config.branding.logo}" alt="${config.branding.name}">
            <span>${config.branding.name}</span>
            <button class="close-button">×</button>
        </div>
        <div class="new-conversation">
            <h2 class="welcome-text">${config.branding.welcomeText}</h2>
            <button class="new-chat-btn">Send us a message</button>
            <p class="response-text">${config.branding.responseTimeText}</p>
        </div>
    `;

    const chatInterfaceHTML = `
        <div class="chat-interface">
            <div class="brand-header">
                <img src="${config.branding.logo}" alt="${config.branding.name}">
                <span>${config.branding.name}</span>
                <button class="close-button">×</button>
            </div>
            <div class="chat-messages"></div>
            <div class="chat-input">
                <textarea placeholder="Type your message here..." rows="1"></textarea>
                <button type="submit">Send</button>
            </div>
            <div class="chat-footer">
                <a href="${config.branding.poweredBy.link}" target="_blank">${config.branding.poweredBy.text}</a>
            </div>
        </div>
    `;

    chatContainer.innerHTML = newConversationHTML + chatInterfaceHTML;

    const toggleButton = document.createElement('button');
    toggleButton.className = `chat-toggle${config.style.position === 'left' ? ' position-left' : ''}`;
    toggleButton.textContent = "💬";

    widgetContainer.appendChild(chatContainer);
    widgetContainer.appendChild(toggleButton);
    document.body.appendChild(widgetContainer);

    const newChatBtn = chatContainer.querySelector('.new-chat-btn');
    const chatInterface = chatContainer.querySelector('.chat-interface');
    const textarea = chatContainer.querySelector('textarea');
    const sendButton = chatContainer.querySelector('button[type="submit"]');

    function generateUUID() {
        return crypto.randomUUID();
    }

    async function sendInitialMessage() {
        const messagesContainer = chatContainer.querySelector('.chat-messages');
        if (!messagesContainer) {
            console.warn("⚠️ messagesContainer is not ready.");
            return;
        }

        const message = "hi";
        if (!currentSessionId) currentSessionId = generateUUID();

        // Optional: Display user's "hi" message
        const userMessageDiv = document.createElement('div');
        userMessageDiv.className = 'chat-message user';
        userMessageDiv.textContent = message;
        messagesContainer.appendChild(userMessageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // ✅ Static welcome message
        const botMessageDiv = document.createElement('div');
        botMessageDiv.className = 'chat-message bot';
        botMessageDiv.textContent = "Hi! How can I assist with your financial questions today?";
        messagesContainer.appendChild(botMessageDiv);
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
            const reply = Array.isArray(data)
                ? data[0]?.output
                : data?.output;

            if (reply) {
                const extraBotMessage = document.createElement('div');
                extraBotMessage.className = 'chat-message bot';
                extraBotMessage.textContent = reply;
                messagesContainer.appendChild(extraBotMessage);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }

        } catch (error) {
            console.error('Initial message failed:', error);
        }
    }

    async function sendMessage(message) {
        const messagesContainer = chatContainer.querySelector('.chat-messages');
        if (!currentSessionId) currentSessionId = generateUUID();

        const messageData = {
            action: "sendMessage",
            sessionId: currentSessionId,
            route: config.webhook.route,
            chatInput: message,
            metadata: { userId: "" }
        };

        const userMessageDiv = document.createElement('div');
        userMessageDiv.className = 'chat-message user';
        userMessageDiv.textContent = message;
        messagesContainer.appendChild(userMessageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        try {
            const response = await fetch(config.webhook.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData)
            });
            const data = await response.json();
            const botMessageDiv = document.createElement('div');
            botMessageDiv.className = 'chat-message bot';
            botMessageDiv.textContent = Array.isArray(data) ? data[0].output : data.output;
            messagesContainer.appendChild(botMessageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } catch (error) {
            console.error('Send message error:', error);
        }
    }

    newChatBtn.addEventListener('click', () => {
        currentSessionId = generateUUID();
        chatContainer.querySelector('.brand-header').style.display = 'none';
        chatContainer.querySelector('.new-conversation').style.display = 'none';
        chatInterface.classList.add('active');

        // ✅ Delay to ensure DOM is ready
        setTimeout(() => {
            sendInitialMessage();
        }, 50);
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

    toggleButton.addEventListener('click', () => {
        const isOpen = chatContainer.classList.toggle('open');

        if (isOpen) {
            if (!currentSessionId) {
                currentSessionId = generateUUID();
                setTimeout(() => {
                    sendInitialMessage();
                }, 50);
            }
            chatContainer.querySelector('.brand-header').style.display = 'none';
            chatContainer.querySelector('.new-conversation').style.display = 'none';
            chatInterface.classList.add('active');
        }
    });

    chatContainer.querySelectorAll('.close-button').forEach(button => {
        button.addEventListener('click', () => {
            chatContainer.classList.remove('open');
        });
    });
})();

