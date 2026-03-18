import axios from 'axios';
import { Platform } from 'react-native';
import type { LoginFlowV2Init, LoginFlowV2Credentials } from '@/types/api';
import { API_PATHS } from '@/config/constants';

export async function initiateLoginFlow(
  serverUrl: string,
): Promise<LoginFlowV2Init> {
  const headers: Record<string, string> = {};
  // Browsers block setting User-Agent via XHR; only set it on native
  if (Platform.OS !== 'web') {
    headers['User-Agent'] = 'EasyTalk/1.0';
  }

  const response = await axios.post<LoginFlowV2Init>(
    `${serverUrl}${API_PATHS.LOGIN_FLOW_V2}`,
    null,
    { headers },
  );
  return response.data;
}

export async function pollForCredentials(
  endpoint: string,
  token: string,
): Promise<LoginFlowV2Credentials> {
  const response = await axios.post<LoginFlowV2Credentials>(
    endpoint,
    `token=${encodeURIComponent(token)}`,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      validateStatus: (status) => status === 200,
    },
  );
  return response.data;
}
