import axios from 'axios';
import {Buffer} from 'buffer';
export default class WordPress {
  url: any;
  headers: {Authorization: string; 'Content-Type': string};
  constructor(wpConfig: any) {
    // Store the URL from the wpConfig object
    this.url = wpConfig.url;

    // Create the headers object with the authorization and content-type headers
    this.headers = {
      Authorization:
        'Basic ' +
        Buffer.from(`${wpConfig.username}:${wpConfig.password}`).toString(
          'base64',
        ),
      'Content-Type': 'application/json',
    };
  }

  async validateCredentials() {
    try {
      const response = await axios.get(
        `${this.url}/wp-json/dokan/v1/products/`,
        {
          headers: {
            ...this.headers,
            'Cache-Control': 'no-cache',
          },
        },
      );
      console.log(response.data);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async getProducts() {
    try {
      const response = await axios.get(
        `${this.url}/wp-json/dokan/v1/products/`,
        {
          headers: {
            ...this.headers,
            'Cache-Control': 'no-cache',
          },
        },
      );
      return response.data;
    } catch (error) {
      // throw new Error(`Error while fetching products: ${error}`);
    }
  }
  async getOrders() {
    try {
      const response = await axios.get(`${this.url}/wp-json/dokan/v1/orders/`, {
        headers: {
          ...this.headers,
          'Cache-Control': 'no-cache',
        },
      });
      return response.data;
    } catch (error) {
      // throw new Error(`Error while fetching orders: ${error}`);
    }
  }
}
