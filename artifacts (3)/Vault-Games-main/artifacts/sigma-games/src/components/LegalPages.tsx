import React from 'react';
import { motion } from 'motion/react';
import { Shield, FileText, Info } from 'lucide-react';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-white mb-3">{title}</h2>
      <div className="text-gray-400 space-y-3 leading-relaxed text-sm">{children}</div>
    </div>
  );
}

export function PrivacyPolicyPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-violet-600/20 p-3 rounded-2xl">
          <Shield className="w-7 h-7 text-violet-400" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
          <p className="text-gray-500 text-sm mt-1">Last updated: March 2025</p>
        </div>
      </div>

      <Section title="Introduction">
        <p>
          Welcome to Vault ("we," "us," or "our"). This Privacy Policy explains how we collect, use,
          disclose, and safeguard your information when you visit and use our gaming platform
          at vault--lmarico.replit.app (the "Site"). Please read this policy carefully. If you
          disagree with its terms, please discontinue use of the Site.
        </p>
      </Section>

      <Section title="Information We Collect">
        <p><strong className="text-white">Information you provide:</strong> When you register, we collect your username, email address, and password (stored securely as a hashed value). You may optionally provide a profile picture and bio.</p>
        <p><strong className="text-white">Automatically collected information:</strong> When you visit the Site, we may automatically collect certain information about your device, including your web browser, IP address, time zone, and cookies installed on your device.</p>
        <p><strong className="text-white">Usage data:</strong> We collect information about games you play, achievements you earn, your streak history, and other in-game activity to power the platform's progression system.</p>
      </Section>

      <Section title="Cookies and Tracking Technologies">
        <p>
          We use cookies and similar tracking technologies to track activity on our Site and store certain information.
          Cookies are files with a small amount of data which may include an anonymous unique identifier.
        </p>
        <p>
          <strong className="text-white">Third-party advertising:</strong> We use Google AdSense to display advertisements on our Site.
          Google uses cookies to serve ads based on your prior visits to our Site or other sites on the internet.
          Google's use of advertising cookies enables it and its partners to serve ads to users based on their visit to our Site and/or other sites on the Internet.
          You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">Google Ads Settings</a>.
        </p>
        <p>
          For more information on how Google uses data when you use our Site, visit:{' '}
          <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">
            How Google uses data when you use our partners' sites or apps
          </a>.
        </p>
      </Section>

      <Section title="How We Use Your Information">
        <p>We use the information we collect to:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Create and manage your account</li>
          <li>Operate and maintain the gaming platform and progression system</li>
          <li>Send you account-related communications</li>
          <li>Display personalized or contextual advertisements through Google AdSense</li>
          <li>Monitor and analyze usage patterns and trends to improve the Site</li>
          <li>Detect, investigate, and prevent fraudulent or unauthorized activity</li>
        </ul>
      </Section>

      <Section title="Sharing Your Information">
        <p>We do not sell, trade, or otherwise transfer your personal information to outside parties except in the following cases:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><strong className="text-white">Service providers:</strong> We may share data with trusted third-party services that help us operate the Site (e.g., hosting providers, analytics).</li>
          <li><strong className="text-white">Advertising partners:</strong> We share data with Google AdSense for the purpose of displaying advertisements. Google's privacy policy governs their use of this data.</li>
          <li><strong className="text-white">Legal requirements:</strong> We may disclose your information if required by law or in response to valid legal requests.</li>
        </ul>
      </Section>

      <Section title="Data Retention">
        <p>
          We retain your account information for as long as your account is active or as needed to provide services.
          You may request deletion of your account and associated data at any time by contacting us.
          Global chat messages are automatically pruned after 200 messages to limit storage.
        </p>
      </Section>

      <Section title="Children's Privacy">
        <p>
          Our Site is not directed to children under the age of 13. We do not knowingly collect personally identifiable
          information from children under 13. If we discover that a child under 13 has provided us with personal
          information, we will delete it immediately.
        </p>
      </Section>

      <Section title="Your Rights">
        <p>Depending on your location, you may have the right to:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Opt out of personalized advertising</li>
        </ul>
        <p>To exercise any of these rights, please contact us.</p>
      </Section>

      <Section title="Third-Party Links">
        <p>
          Our Site contains embedded games and links to third-party websites. We have no control over the content,
          privacy policies, or practices of any third-party sites or services and encourage you to review the
          privacy policy of every site you visit.
        </p>
      </Section>

      <Section title="Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the
          new Privacy Policy on this page with an updated date. Your continued use of the Site after any changes
          constitutes your acceptance of the new policy.
        </p>
      </Section>

      <Section title="Contact Us">
        <p>If you have questions about this Privacy Policy, please contact us at <a href="mailto:contact@vaultgames.site" className="text-violet-400 hover:underline">contact@vaultgames.site</a>.</p>
      </Section>
    </motion.div>
  );
}

export function TermsOfServicePage() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-blue-600/20 p-3 rounded-2xl">
          <FileText className="w-7 h-7 text-blue-400" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white">Terms of Service</h1>
          <p className="text-gray-500 text-sm mt-1">Last updated: March 2025</p>
        </div>
      </div>

      <Section title="Acceptance of Terms">
        <p>
          By accessing and using Vault ("the Site"), you accept and agree to be bound by these Terms of Service.
          If you do not agree to these terms, you may not use the Site.
        </p>
      </Section>

      <Section title="Use of the Site">
        <p>You agree to use the Site only for lawful purposes and in a manner consistent with all applicable laws. You agree not to:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Use the Site for any unlawful purpose or in violation of any applicable regulations</li>
          <li>Attempt to gain unauthorized access to any part of the Site or its related systems</li>
          <li>Upload or transmit harmful, offensive, or inappropriate content in the global chat or profile fields</li>
          <li>Harass, threaten, or harm other users</li>
          <li>Use bots, scripts, or automation to artificially inflate your in-game stats or coins</li>
          <li>Attempt to reverse-engineer or exploit the platform</li>
        </ul>
      </Section>

      <Section title="Accounts">
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and for all activities
          that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
          We reserve the right to terminate accounts that violate these Terms at our sole discretion.
        </p>
      </Section>

      <Section title="Virtual Currency and Items">
        <p>
          Coins, XP, levels, skins, and other in-game items are virtual goods with no real-world monetary value.
          They cannot be redeemed for real money, transferred between accounts, or sold.
          We reserve the right to modify, reset, or remove virtual currency and items at any time.
        </p>
      </Section>

      <Section title="User-Generated Content">
        <p>
          By submitting content to the Site (including chat messages, usernames, or profile information),
          you grant us a non-exclusive, royalty-free license to use, display, and moderate that content.
          You are solely responsible for any content you submit and represent that you have the right to do so.
        </p>
      </Section>

      <Section title="Advertising">
        <p>
          The Site may display advertisements served by Google AdSense and other advertising networks.
          These ads help support the free operation of the Site. We are not responsible for the content of
          third-party advertisements.
        </p>
      </Section>

      <Section title="Embedded Games">
        <p>
          Games embedded on this Site are provided by third-party developers and are subject to their own
          terms of service. We do not claim ownership of embedded third-party games and are not responsible
          for their content or functionality.
        </p>
      </Section>

      <Section title="Disclaimer of Warranties">
        <p>
          The Site is provided on an "as is" and "as available" basis without any warranties of any kind,
          either express or implied. We do not warrant that the Site will be uninterrupted, error-free,
          or free of viruses or other harmful components.
        </p>
      </Section>

      <Section title="Limitation of Liability">
        <p>
          To the maximum extent permitted by law, we shall not be liable for any indirect, incidental,
          special, consequential, or punitive damages arising out of or related to your use of the Site,
          including but not limited to loss of data, loss of profits, or loss of virtual items.
        </p>
      </Section>

      <Section title="Changes to Terms">
        <p>
          We reserve the right to modify these Terms at any time. Changes will be effective immediately upon
          posting to the Site. Your continued use of the Site after any changes constitutes acceptance of the new Terms.
        </p>
      </Section>

      <Section title="Contact">
        <p>If you have questions about these Terms, please contact us at <a href="mailto:contact@vaultgames.site" className="text-violet-400 hover:underline">contact@vaultgames.site</a>.</p>
      </Section>
    </motion.div>
  );
}

export function AboutPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-emerald-600/20 p-3 rounded-2xl">
          <Info className="w-7 h-7 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white">About Vault</h1>
          <p className="text-gray-500 text-sm mt-1">The ultimate unblocked gaming platform</p>
        </div>
      </div>

      <Section title="What is Vault?">
        <p>
          Vault is a free online gaming platform featuring 48+ hand-picked, unblocked games across a wide variety
          of categories including Action, Puzzle, Sports, IO Games, Clicker, Classics, and more. Play anywhere,
          anytime — no downloads, no installs.
        </p>
      </Section>

      <Section title="Progression System">
        <p>
          Vault features a deep progression system to keep you engaged. Earn XP and coins by playing games,
          level up to unlock exclusive titles and rewards, and maintain daily login streaks to multiply your earnings.
          Reach level 100 to unlock the coveted Prestige rank and start again with a permanent multiplier boost.
        </p>
      </Section>

      <Section title="Quests & Achievements">
        <p>
          Complete daily and weekly quests to earn bonus coins. Unlock 35+ achievements by hitting milestones
          like playing 100 games, reaching a 30-day streak, or accumulating 10,000 coins. Each achievement
          comes with a substantial coin reward to spend in the store.
        </p>
      </Section>

      <Section title="The Store">
        <p>
          Spend your coins in the Neon Store on cosmetic upgrades like premium themes (Neon Glow, Emerald, Ruby),
          profile badges (Golden Crown, Diamond Crown, VIP), avatar effects (Glitch FX), snake skins, and
          Streak Freezes to protect your login streaks.
        </p>
      </Section>

      <Section title="Social Features">
        <p>
          Vault has a built-in Social Hub where you can chat with all players globally in real time,
          add friends, send private messages, and search for other players by username.
          Create a free account to access all social features and sync your progress across devices.
        </p>
      </Section>

      <Section title="Free to Play">
        <p>
          Vault is completely free to use. All coins, items, and progression are earned through gameplay —
          there are no purchases, paywalls, or pay-to-win mechanics. The platform is supported by advertising.
        </p>
      </Section>

      <Section title="Why Players Stick Around">
        <p>
          Vault is designed for both quick breaks and repeat visits. You can jump into a game in seconds,
          then come back later for quests, rewards, achievements, and profile progression. That combination
          of instant access and long-term goals keeps the site fresh without getting in the way of play.
        </p>
      </Section>

      <Section title="Contact & Feedback">
        <p>
          Have feedback, suggestions, or found a bug? We'd love to hear from you! Reach out to us at{' '}
          <a href="mailto:contact@vaultgames.site" className="text-violet-400 hover:underline">contact@vaultgames.site</a>.
        </p>
      </Section>
    </motion.div>
  );
}
