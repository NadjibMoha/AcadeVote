import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '5s', target: 100 },
    { duration: '20s', target: 100 },
    { duration: '5s', target: 0 },
  ],
};

const BASE_URL = 'http://127.0.0.1:3001/api';

export function setup() {
  const payload = JSON.stringify({
    username: 'voter1',
    password: 'voter123',
  });
  const headers = { 'Content-Type': 'application/json' };

  const res = http.post(`${BASE_URL}/auth/login`, payload, { headers });

  if (res.status !== 200) {
    throw new Error(`Failed to login during setup: ${res.status} ${res.body}`);
  }
  return { token: res.json('token') };
}

export default function (data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type': 'application/json'
  };

  const res = http.get(`${BASE_URL}/elections`, { headers });

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
