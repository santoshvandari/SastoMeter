import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: 'BuyHatke - Daraz Price Tracker',
  description: 'Track price history on Daraz and save money with crowdsourced data',
  version: pkg.version,
  icons: {
    48: 'public/logo.png',
  },
  permissions: [
    'sidePanel',
    'activeTab',
  ],
  host_permissions: [
    '*://*.daraz.com.np/*',
    // '*://*.daraz.pk/*',
    // '*://*.daraz.com.bd/*',
    // '*://*.daraz.lk/*',
    // '*://*.daraz.com.mm/*',
  ],
  action: {
    default_icon: {
      48: 'public/logo.png',
    },
    default_popup: 'src/popup/index.html',
  },
  content_scripts: [
    {
      js: ['src/content/main.jsx'],
      matches: [
        '*://*.daraz.com.np/*',
        // '*://*.daraz.pk/*',
        // '*://*.daraz.com.bd/*',
        // '*://*.daraz.lk/*',
        // '*://*.daraz.com.mm/*',
      ],
      run_at: 'document_end',
    },
    {
      js: ['src/content/crowdsourcing.js'],
      matches: [
        '*://*.daraz.com.np/*',
        // '*://*.daraz.pk/*',
        // '*://*.daraz.com.bd/*',
        // '*://*.daraz.lk/*',
        // '*://*.daraz.com.mm/*',
      ],
      run_at: 'document_start',
      world: 'MAIN',
    },
  ],
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
})

