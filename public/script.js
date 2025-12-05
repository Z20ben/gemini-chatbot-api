document.addEventListener('DOMContentLoaded', () => {
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-box'); // Menggunakan ID dari HTML Anda

  /**
   * Mengubah markdown sederhana (hanya bold) menjadi HTML.
   * @param {string} text - Teks yang akan di-parse.
   * @returns {string} - String HTML.
   */
  const renderMarkdown = (text) => {
    let html = text
      // Escape HTML tags to prevent XSS
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks (```...```)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang ? ` class="language-${lang}"` : '';
      return `<pre><code${language}>${code.trim()}</code></pre>`;
    });

    // Inline code (`)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold (**)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic (*)
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Unordered lists (* or -)
    html = html.replace(/^\s*([*-]) (.*)/gm, '<ul><li>$2</li></ul>');
    // Collapse consecutive list items into a single list
    html = html.replace(/<\/ul>\n<ul>/g, '');

    // Convert newlines to <br> tags
    return html.replace(/\n/g, '<br>');
  };

  /**
   * Appends a message to the chat box.
   * @param {string} text - The message content.
   * @param {string} sender - The sender of the message ('user' or 'bot').
   * @returns {HTMLElement} The created message element.
   */
  const appendMessage = (text, sender) => {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);

    const p = document.createElement('p');
    // Gunakan innerHTML untuk merender format bold dari markdown
    p.innerHTML = renderMarkdown(text);
    messageElement.appendChild(p);

    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
    return messageElement;
  };

  /**
   * Handles the chat form submission.
   * @param {Event} event - The form submission event.
   */
  const handleChatSubmit = async (event) => {
    event.preventDefault();
    const userMessage = userInput.value.trim();

    if (!userMessage) {
      return;
    }

    // 1. Add user's message to the chat box
    appendMessage(userMessage, 'user');
    userInput.value = '';

     // 2. Tampilkan pesan "Thinking..." sementara dengan animasi
    const thinkingMessageElement = appendMessage('Thinking', 'bot');
    thinkingMessageElement.querySelector('p').classList.add('thinking');

    try {
      // 3. Send the user's message as a POST request
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation: [{ role: 'user', text: userMessage }],
        }),
      });

      const botMessageParagraph = thinkingMessageElement.querySelector('p');

      if (!response.ok) {
        throw new Error('Failed to get response from server.');
      }

      const data = await response.json();

      // 4. Ganti pesan "Thinking..." dengan balasan dari AI
      botMessageParagraph.classList.remove('thinking');

      if (data && data.result) {
        botMessageParagraph.innerHTML = renderMarkdown(data.result);
      } else {
        botMessageParagraph.textContent = 'Maaf, tidak ada respons yang diterima.';
      }
    } catch (error) {
      // 5. Handle errors
      const botMessageParagraph = thinkingMessageElement.querySelector('p');
      botMessageParagraph.classList.remove('thinking');
      botMessageParagraph.textContent = error.message || 'Gagal mendapatkan respons dari server.';
      console.error('Chat Error:', error);
    } finally {
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  };

  chatForm.addEventListener('submit', handleChatSubmit);
});
