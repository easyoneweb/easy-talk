import axios from 'axios';
import type { LoginFlowV2Init, LoginFlowV2Credentials } from '@/types/api';
import { API_PATHS } from '@/config/constants';

export async function initiateLoginFlow(
  serverUrl: string,
): Promise<LoginFlowV2Init> {
  const response = await axios.post<LoginFlowV2Init>(
    `${serverUrl}${API_PATHS.LOGIN_FLOW_V2}`,
    null,
    {
      headers: {
        'User-Agent': 'EasyTalk/1.0',
      },
    },
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
