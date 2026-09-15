const API_BASE_URL = 'http://192.168.212.213:5000';

export interface BackendLoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      name: string;
      email: string;
      role: 'ADMIN' | 'FACULTY' | 'STUDENT';
    };
    token: string;
  };
}

export async function loginApi(
  identifier: string,
  password: string
): Promise<BackendLoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        identifier,
        password,
    }),
  });

  let result: any;

  try {
    result = await response.json();
  } catch {
    throw new Error(`Server returned an invalid response (${response.status})`);
  }

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Invalid credentials');
  }

  return result;
}

export async function getStudentDashboard(accessToken: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/student/dashboard`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  let result: any;

  try {
    result = await response.json();
  } catch {
    throw new Error(
      `Server returned an invalid response (${response.status})`
    );
  }

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || 'Failed to load student dashboard'
    );
  }

  return result;
}

export async function getStudentProfile(accessToken: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/student/profile`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const rawText = await response.text();

  console.log('PROFILE STATUS:', response.status);
  console.log('PROFILE RAW:', rawText);

  let result: any;

  try {
    result = JSON.parse(rawText);
  } catch {
    throw new Error(
      `Invalid server response (${response.status})`
    );
  }

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || 'Failed to load student profile'
    );
  }

  return result.data;
}