export default defineNitroPlugin((nitroApp) => {
  let isShuttingDown = false;

  // Function to send a Discord notification
  const sendDiscordNotification = async (message: string, color: number) => {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      console.warn('[Discord] DISCORD_WEBHOOK_URL not configured, skipping notification');
      return;
    }

    const isDev = process.env.NODE_ENV === 'development';
    const mode = isDev ? 'Development' : 'Production';
    const emoji = isDev ? '🔧' : '🚀';

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          embeds: [{
            title: `${emoji} Aeroliths - ${mode}`,
            description: message,
            color: color,
            timestamp: new Date().toISOString(),
            footer: {
              text: `Mode: ${mode} | Host: ${process.env.HOST || 'localhost'}:${process.env.PORT || 3000}`
            }
          }]
        })
      });

      if (!response.ok) {
        console.error('[Discord] Failed to send notification:', response.statusText);
      } else {
        console.log(`[Discord] Notification sent: ${message}`);
      }
    } catch (error) {
      console.error('[Discord] Error sending notification:', error);
    }
  };

  // Startup notification - wait for Nitro to be ready
  let startupNotified = false;

  nitroApp.hooks.hook('request', async () => {
    // Send notification only once on first request
    if (!startupNotified) {
      startupNotified = true;

      const isDev = process.env.NODE_ENV === 'development';
      const message = isDev
        ? '✅ Le serveur de développement est démarré et prêt !'
        : '✅ Le serveur de production est démarré et prêt !';
      const color = isDev ? 0x00D9FF : 0x00FF00; // Cyan for dev, green for prod

      await sendDiscordNotification(message, color);
    }
  });

  // Nitro hook to detect shutdown
  nitroApp.hooks.hook('close', async () => {
    if (!isShuttingDown) {
      isShuttingDown = true;
      const isDev = process.env.NODE_ENV === 'development';
      const message = isDev
        ? '⚠️ Le serveur de développement s\'arrête...'
        : '⚠️ Le serveur de production s\'arrête...';
      const color = 0xFFA500;

      try {
        await sendDiscordNotification(message, color);
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (error) {
        console.error('[Discord] Error during shutdown notification:', error);
      }
    }
  });

  // Server shutdown notifications
  const handleShutdown = async (signal: string) => {
    // Prevent multiple calls
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;

    const isDev = process.env.NODE_ENV === 'development';
    const message = isDev
      ? `⚠️ Le serveur de développement s'arrête... (${signal})`
      : `⚠️ Le serveur de production s'arrête... (${signal})`;
    const color = 0xFFA500; // Orange for shutdowns

    try {
      await sendDiscordNotification(message, color);
      // Give some time to send the notification
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.error('[Discord] Error during shutdown notification:', error);
    }

    process.exit(0);
  };

  // Capture different shutdown signals
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT')); // Ctrl+C

  // For Windows, also use beforeExit
  if (process.platform === 'win32') {
    process.on('beforeExit', () => {
      if (!isShuttingDown) {
        handleShutdown('beforeExit');
      }
    });
  } else {
    process.on('SIGHUP', () => handleShutdown('SIGHUP'));
  }

  // Capture uncaught exceptions
  process.on('uncaughtException', async (error) => {
    const isDev = process.env.NODE_ENV === 'development';
    const message = isDev
      ? `❌ Erreur critique en développement : ${error.message}`
      : `❌ Erreur critique en production : ${error.message}`;
    const color = 0xFF0000; // Red for errors

    await sendDiscordNotification(message, color);
    await new Promise(resolve => setTimeout(resolve, 1000));
    process.exit(1);
  });
});
