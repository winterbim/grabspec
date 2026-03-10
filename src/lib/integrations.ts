/**
 * Integrations service - Manage connections with external platforms
 * Slack, Google Drive, Dropbox, Notion, Airtable
 */

export type IntegrationType = 'slack' | 'google-drive' | 'dropbox' | 'notion' | 'airtable';

export interface IntegrationConfig {
  id: string;
  type: IntegrationType;
  name: string;
  isEnabled: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  settings: Record<string, unknown>;
  createdAt: string;
  lastUsedAt?: string;
}

export interface IntegrationEvent {
  integrationId: string;
  type: 'search_completed' | 'export_created' | 'project_shared';
  data: Record<string, unknown>;
  timestamp: string;
}

/**
 * Get OAuth authorization URL for integration
 */
export function getAuthorizationUrl(
  integrationType: IntegrationType,
  redirectUri: string
): string {
  const baseUrls: Record<IntegrationType, string> = {
    'slack': 'https://slack.com/oauth_authorize',
    'google-drive': 'https://accounts.google.com/o/oauth2/v2/auth',
    'dropbox': 'https://www.dropbox.com/oauth2/authorize',
    'notion': 'https://api.notion.com/v1/oauth/authorize',
    'airtable': 'https://airtable.com/oauth2/v1/authorize',
  };

  const params = new URLSearchParams({
    redirect_uri: redirectUri,
    response_type: 'code',
  });

  return `${baseUrls[integrationType]}?${params.toString()}`;
}

/**
 * Slack integration handlers
 */
export const SlackIntegration = {
  async notifySearchComplete(
    config: IntegrationConfig,
    searchResult: { projectName: string; productCount: number; foundCount: number }
  ) {
    if (!config.accessToken) throw new Error('Slack token not configured');

    const webhook = config.settings.webhookUrl as string;
    if (!webhook) throw new Error('Slack webhook URL not configured');

    const message = {
      text: `✅ Search completed for project: ${searchResult.projectName}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'GrabSpec Search Completed',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Project:*\n${searchResult.projectName}`,
            },
            {
              type: 'mrkdwn',
              text: `*Results:*\n${searchResult.foundCount}/${searchResult.productCount}`,
            },
          ],
        },
      ],
    };

    const response = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) throw new Error('Failed to send Slack notification');
  },
};

/**
 * Google Drive integration handlers
 */
export const GoogleDriveIntegration = {
  async saveExport(
    config: IntegrationConfig,
    fileBlob: Blob,
    filename: string,
    folderId?: string
  ) {
    if (!config.accessToken) throw new Error('Google Drive token not configured');

    const metadata = {
      name: filename,
      mimeType: 'application/zip',
      parents: folderId ? [folderId] : [],
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', fileBlob);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
      },
      body: form,
    });

    if (!response.ok) throw new Error('Failed to upload to Google Drive');
    return response.json();
  },

  async listFolders(config: IntegrationConfig) {
    if (!config.accessToken) throw new Error('Google Drive token not configured');

    const response = await fetch(
      'https://www.googleapis.com/drive/v3/files?q=mimeType="application/vnd.google-apps.folder"&spaces=drive&fields=files(id,name)',
      {
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
        },
      }
    );

    if (!response.ok) throw new Error('Failed to fetch Google Drive folders');
    return response.json();
  },
};

/**
 * Dropbox integration handlers
 */
export const DropboxIntegration = {
  async saveExport(config: IntegrationConfig, fileBlob: Blob, filename: string, path = '/') {
    if (!config.accessToken) throw new Error('Dropbox token not configured');

    const fullPath = `${path}${filename}`;

    const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          path: fullPath,
          mode: 'add',
          autorename: true,
        }),
      },
      body: fileBlob,
    });

    if (!response.ok) throw new Error('Failed to upload to Dropbox');
    return response.json();
  },
};

/**
 * Notion integration handlers
 */
export const NotionIntegration = {
  async saveSearchResult(
    config: IntegrationConfig,
    databaseId: string,
    result: {
      productName: string;
      manufacturer?: string;
      reference?: string;
      imageUrl?: string;
      datasheetUrl?: string;
    }
  ) {
    if (!config.accessToken) throw new Error('Notion token not configured');

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          Name: { title: [{ text: { content: result.productName } }] },
          Manufacturer: { rich_text: [{ text: { content: result.manufacturer || '' } }] },
          Reference: { rich_text: [{ text: { content: result.reference || '' } }] },
        },
      }),
    });

    if (!response.ok) throw new Error('Failed to create Notion page');
    return response.json();
  },
};

/**
 * Airtable integration handlers
 */
export const AirtableIntegration = {
  async saveSearchResult(
    config: IntegrationConfig,
    baseId: string,
    tableId: string,
    record: Record<string, unknown>
  ) {
    if (!config.accessToken) throw new Error('Airtable token not configured');

    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/${tableId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: [
            {
              fields: record,
            },
          ],
        }),
      }
    );

    if (!response.ok) throw new Error('Failed to create Airtable record');
    return response.json();
  },

  async listBases(config: IntegrationConfig) {
    if (!config.accessToken) throw new Error('Airtable token not configured');

    const response = await fetch('https://api.airtable.com/v0/meta/bases', {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
      },
    });

    if (!response.ok) throw new Error('Failed to fetch Airtable bases');
    return response.json();
  },
};
