import axios, { AxiosInstance } from 'axios';
import { Injectable } from '@nestjs/common';

@Injectable()
class OAuth2Client {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://oauth2.googleapis.com',
    });
  }

  async getToken(
    code: string,
  ): Promise<{ access_token: string; id_token: string }> {
    const response = await this.client.post(
      '/token',
      new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        grant_type: 'authorization_code',
      }),
    );
    return response.data;
  }
}

export default OAuth2Client;
