<template>
  <div class="legal-container">
    <h1 class="legal-title">Legal Notice & Terms of Use</h1>

    <section class="legal-section">
      <h2>1. Publisher / Developer Identification</h2>
      <div class="legal-content">
        <p><strong>Game Name:</strong> {{ SITE_INFO.name }}</p>
        <p><strong>Developer / Studio:</strong> {{ SITE_INFO.developer.name }}</p>
        <p><strong>Legal Status:</strong> {{ SITE_INFO.developer.status }}</p>
        <p><strong>Contact / Support:</strong> <a :href="SITE_INFO.discord.url" target="_blank" rel="noopener noreferrer" class="discord-link">{{ SITE_INFO.discord.label }}</a></p>
        <p><strong>Publication Director:</strong> {{ SITE_INFO.developer.director }}</p>
      </div>
    </section>

    <section class="legal-section">
      <h2>2. Hosting / Distribution</h2>
      <div class="legal-content">
        <p>The game and its official website are hosted by:</p>
        <p><strong>Hosting Provider:</strong> {{ SITE_INFO.hosting.provider }}</p>
        <p><strong>Address:</strong> {{ SITE_INFO.hosting.address }}</p>
        <p><strong>Website:</strong> <a :href="SITE_INFO.hosting.website" target="_blank" rel="noopener noreferrer">{{ SITE_INFO.hosting.website }}</a></p>
      </div>
    </section>

    <section class="legal-section">
      <h2>3. Intellectual Property Rights</h2>
      <div class="legal-content">
        <h3>Ownership of Original Content</h3>
        <p>
          All original elements of the game <strong>{{ SITE_INFO.name }}</strong> are the exclusive
          intellectual property of <strong>{{ SITE_INFO.developer.name }}</strong>. This includes,
          but is not limited to:
        </p>
        <ul>
          <li><strong>Source Code:</strong> All programming code, scripts, algorithms, and technical implementations</li>
          <li><strong>Visual Assets:</strong> Original graphics, artwork, UI/UX designs, icons, and visual effects</li>
          <li><strong>Audio Content:</strong> Music, sound effects, and audio implementations (excluding third-party licensed content)</li>
          <li><strong>Game Mechanics:</strong> Original gameplay systems, card mechanics, and strategic elements unique to Aeroliths</li>
          <li><strong>User Interface:</strong> All interface designs, layouts, navigation systems, and user experience elements</li>
          <li><strong>Branding:</strong> The Aeroliths name, logo, and associated branding materials</li>
        </ul>

        <h3>Usage Restrictions</h3>
        <p>
          Without prior written authorization from <strong>{{ SITE_INFO.developer.name }}</strong>,
          you may not:
        </p>
        <ul>
          <li>Copy, reproduce, distribute, or create derivative works based on the game</li>
          <li>Decompile, reverse-engineer, or extract source code from the application</li>
          <li>Use game assets (graphics, sounds, code) in other projects or applications</li>
          <li>Commercially exploit the game or any of its components</li>
          <li>Remove, alter, or obscure any copyright notices, branding, or attribution</li>
          <li>Use the game's name, logo, or branding for promotional purposes without permission</li>
        </ul>

        <h3>Game Inspiration & Attribution</h3>
        <p>
          <strong>{{ SITE_INFO.name }}</strong> is a fan-made game inspired by the <strong>Skystones</strong>
          mini-game from the <strong>Skylanders</strong> franchise. This project was created as an
          independent tribute to celebrate the original game mechanics that inspired countless players.
        </p>

        <h4>Important Disclaimers</h4>
        <ul>
          <li><strong>No Affiliation:</strong> Aeroliths is NOT affiliated with, endorsed by, sponsored by, or officially connected to Activision, Toys for Bob, or any entities associated with the Skylanders franchise</li>
          <li><strong>Fan Project:</strong> This is a non-commercial fan project created for educational and entertainment purposes</li>
          <li><strong>Original Implementation:</strong> While inspired by Skystones, all code, assets, and implementations are original creations</li>
          <li><strong>Respect for Original IP:</strong> We fully respect and acknowledge all intellectual property rights of the original Skylanders franchise</li>
        </ul>

        <h4>Trademark Acknowledgments</h4>
        <p>
          <strong>Skylanders</strong> and <strong>Skystones</strong> are registered trademarks of
          Activision Publishing, Inc. All rights to the Skylanders franchise, including the original
          Skystones game concept, characters, and related intellectual property, belong to their
          respective owners.
        </p>
        <p>
          The use of these terms is solely for the purpose of identification and description of the
          inspiration behind this fan project. No claim of ownership or endorsement is made or implied.
        </p>

        <h3>Third-Party Components</h3>
        <p>
          This project incorporates open-source software and third-party libraries, each governed
          by their respective licenses:
        </p>

        <h4>Core Technologies</h4>
        <ul>
          <li><strong>Nuxt.js:</strong> MIT License - A Vue.js framework for building modern web applications</li>
          <li><strong>Vue.js:</strong> MIT License - Progressive JavaScript framework for building user interfaces</li>
          <li><strong>Nuxt UI:</strong> MIT License - UI component library for Nuxt applications</li>
          <li><strong>TypeScript:</strong> Apache 2.0 License - JavaScript with syntax for types</li>
        </ul>

        <h4>Additional Dependencies</h4>
        <p>
          A complete list of all third-party libraries, dependencies, and their respective licenses
          will be made available on a dedicated <strong>Credits</strong> page. We are committed to
          full transparency and compliance with all open-source licenses.
        </p>

        <h3>User-Generated Content</h3>
        <p>
          If and when user-generated content features are implemented (such as custom card designs,
          deck sharing, or community creations):
        </p>
        <ul>
          <li>You retain ownership of your original content</li>
          <li>You grant Aeroliths a non-exclusive, worldwide license to display and distribute your content within the game</li>
          <li>You confirm that your content does not infringe on any third-party rights</li>
          <li>We reserve the right to remove content that violates our terms or community guidelines</li>
        </ul>

        <h3>Copyright Infringement Reporting</h3>
        <p>
          If you believe that content within Aeroliths infringes your copyright or other intellectual
          property rights, please contact us immediately via our
          <a :href="SITE_INFO.discord.url" target="_blank" rel="noopener noreferrer" class="discord-link">Discord server</a>
          with the following information:
        </p>
        <ul>
          <li>Description of the copyrighted work you claim has been infringed</li>
          <li>Identification of the material that is allegedly infringing</li>
          <li>Your contact information (email, name, address)</li>
          <li>A statement of good faith belief that the use is not authorized</li>
          <li>A statement that the information provided is accurate</li>
        </ul>
        <p>
          We take intellectual property rights seriously and will respond promptly to valid
          infringement claims in accordance with applicable laws.
        </p>
      </div>
    </section>

    <section class="legal-section">
      <h2>4. Health Warning (Photosensitive Seizure Warning)</h2>
      <div class="legal-content">
        <p>
          Some individuals may experience epileptic seizures or loss of consciousness when exposed
          to certain types of strong light stimulation, rapid succession of images, or repetitions
          of simple geometric shapes, flashes, or explosions. These individuals risk seizures when
          playing certain video games containing such stimulations.
        </p>
        <p>
          It is recommended to consult a doctor before use if you or a family member have previously
          shown symptoms related to epilepsy. If you experience dizziness, vision disturbances, or
          discomfort, stop playing immediately.
        </p>
      </div>
    </section>

    <section class="legal-section">
      <h2>5. Personal Data Protection (GDPR)</h2>
      <div class="legal-content">
        <h3>What Data We Collect</h3>
        <p>
          To provide you with the best gaming experience, <strong>Aeroliths</strong> collects
          the following personal data when you create an account and play:
        </p>
        <ul>
          <li><strong>Account Information:</strong> Username, email address</li>
          <li><strong>Game Data:</strong> Game statistics, matches played, wins/losses, rankings</li>
          <li><strong>Technical Data:</strong> IP address, browser type, connection logs</li>
          <li><strong>Game Progress:</strong> Your card collection, achievements, player level</li>
        </ul>

        <h3>How We Use Your Data</h3>
        <p>
          The data collected is used exclusively for the following purposes:
        </p>
        <ul>
          <li>Managing your player account and authentication</li>
          <li>Saving your game progress and statistics</li>
          <li>Displaying global and personal leaderboards</li>
          <li>Matchmaking and multiplayer functionality</li>
          <li>Detecting bugs and improving game performance</li>
          <li>Communicating important game updates (with your consent)</li>
        </ul>

        <h3>Data Security</h3>
        <p>
          We implement industry-standard security measures to protect your personal data.
          Your password is encrypted, and we never share your information with third parties
          for commercial purposes.
        </p>

        <h3>Data Retention</h3>
        <p>
          Your game data is retained as long as your account remains active. If you delete
          your account, all associated personal data will be permanently removed within 30 days.
        </p>

        <h3>Your Rights Under GDPR</h3>
        <p>
          In accordance with the General Data Protection Regulation (GDPR), you have the following rights:
        </p>
        <ul>
          <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
          <li><strong>Right to Rectification:</strong> Correct any inaccurate data</li>
          <li><strong>Right to Erasure:</strong> Request deletion of your account and all data</li>
          <li><strong>Right to Data Portability:</strong> Receive your data in a portable format</li>
          <li><strong>Right to Object:</strong> Object to certain data processing activities</li>
        </ul>
        <p>
          To exercise any of these rights, please contact us on our Discord server: <strong><a :href="SITE_INFO.discord.url" target="_blank" rel="noopener noreferrer" class="discord-link">{{ SITE_INFO.discord.label }}</a></strong>
        </p>
      </div>
    </section>

    <section class="legal-section">
      <h2>6. Cookies and Trackers</h2>
      <div class="legal-content">
        <p>
          This website may use cookies and local storage for the following purposes:
        </p>
        <ul>
          <li><strong>Essential Cookies:</strong> For game state management and user preferences</li>
          <li><strong>Analytics (Optional):</strong> Anonymous technical data may be collected for
          statistical purposes to improve the gaming experience (e.g., performance metrics, crash reports)</li>
        </ul>
        <p>
          You can manage cookie preferences through your browser settings. Note that disabling certain
          cookies may affect game functionality.
        </p>
      </div>
    </section>

    <section class="legal-section">
      <h2>7. Limitation of Liability</h2>
      <div class="legal-content">
        <p>
          The game <strong>{{ SITE_INFO.name }}</strong> is provided "as is", without warranty of any kind,
          express or implied. <strong>{{ SITE_INFO.developer.name }}</strong> cannot be held responsible for
          direct or indirect damages caused to the user's equipment (bugs, loss of save data, hardware
          incompatibility, browser compatibility issues) during use of the game.
        </p>
        <p>The user acknowledges using this game at their own risk.</p>
      </div>
    </section>

    <section class="legal-section">
      <h2>8. User Conduct & Acceptable Use Policy</h2>
      <div class="legal-content">
        <p>
          By accessing and using <strong>{{ SITE_INFO.name }}</strong>, you agree to comply with
          the following code of conduct. These rules ensure a fair, respectful, and enjoyable
          gaming environment for all players.
        </p>

        <h3>Prohibited Activities</h3>
        <p>Users are strictly prohibited from engaging in the following activities:</p>

        <h4>Security & Integrity</h4>
        <ul>
          <li><strong>Hacking & Exploitation:</strong> Do not attempt to hack, reverse-engineer, decompile, disassemble, or exploit the game's code, mechanics, or infrastructure</li>
          <li><strong>Cheating:</strong> Do not use any third-party software, mods, scripts, or tools designed to gain an unfair advantage</li>
          <li><strong>Automated Tools:</strong> Do not use bots, macros, auto-clickers, or any automated systems to play the game or farm resources</li>
          <li><strong>Account Sharing:</strong> Do not share, sell, trade, or transfer your account credentials or access to other users</li>
          <li><strong>Bug Exploitation:</strong> Do not intentionally exploit bugs, glitches, or errors for personal gain. Report them immediately on our Discord</li>
        </ul>

        <h4>Community Standards</h4>
        <ul>
          <li><strong>Respectful Behavior:</strong> Treat all players with respect and courtesy. No harassment, bullying, threats, or hate speech</li>
          <li><strong>Appropriate Content:</strong> Do not use offensive, vulgar, discriminatory, or sexually explicit language in usernames, messages, or any user-generated content</li>
          <li><strong>No Spam:</strong> Do not spam chat, game lobbies, or communication channels with repetitive or irrelevant messages</li>
          <li><strong>Fair Play:</strong> Do not intentionally disrupt gameplay, sabotage matches, or engage in unsportsmanlike conduct</li>
          <li><strong>Privacy Respect:</strong> Do not share other players' personal information without their explicit consent</li>
        </ul>

        <h4>Legal Compliance</h4>
        <ul>
          <li><strong>Age Requirements:</strong> Users under 13 years old must have parental consent to create an account</li>
          <li><strong>Impersonation:</strong> Do not impersonate other players, moderators, developers, or public figures</li>
          <li><strong>Intellectual Property:</strong> Do not infringe on copyrights, trademarks, or other intellectual property rights</li>
          <li><strong>Illegal Activities:</strong> Do not use the platform for any illegal activities or purposes</li>
        </ul>

        <h3>Reporting Violations</h3>
        <p>
          If you witness or experience violations of this code of conduct, please report them
          immediately through our <a :href="SITE_INFO.discord.url" target="_blank" rel="noopener noreferrer" class="discord-link">Discord server</a>.
          Include relevant details such as usernames, timestamps, and screenshots when possible.
        </p>

        <h3>Consequences of Violations</h3>
        <p>
          Violations of these terms may result in disciplinary actions, including but not limited to:
        </p>
        <ul>
          <li><strong>Warning:</strong> First-time minor infractions may result in an official warning</li>
          <li><strong>Temporary Suspension:</strong> Repeated or moderate violations may lead to temporary account suspension (7-30 days)</li>
          <li><strong>Permanent Ban:</strong> Severe or repeated violations will result in permanent account termination without refund or appeal</li>
          <li><strong>Legal Action:</strong> In cases of illegal activities, hacking, or severe misconduct, we reserve the right to pursue legal action</li>
        </ul>

        <p>
          The severity of disciplinary action is determined at our sole discretion based on the
          nature and frequency of violations. We reserve the right to terminate any account without
          prior notice if we believe it threatens the safety, security, or integrity of the game
          or its community.
        </p>
      </div>
    </section>

    <section class="legal-section">
      <h2>9. Modifications to Terms</h2>
      <div class="legal-content">
        <p>
          We reserve the right to modify these terms at any time. Changes will be posted on this page
          with an updated date. Continued use of the game after modifications constitutes acceptance
          of the new terms.
        </p>
      </div>
    </section>

    <section class="legal-section">
      <h2>10. Applicable Law</h2>
      <div class="legal-content">
        <p>
          These legal notices are governed by French law. In case of dispute, and failing an amicable
          agreement, French courts will have sole jurisdiction.
        </p>
        <p><strong>Last Updated:</strong> {{ SITE_INFO.lastUpdated }}</p>
      </div>
    </section>

    <div class="legal-footer">
      <NuxtLink to="/" class="back-link">
        <span class="back-button">Back to Home</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SITE_INFO } from '~/constants/site'
</script>

<style scoped src="~/assets/css/legal.css"></style>
