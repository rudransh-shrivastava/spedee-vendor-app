import axios from 'axios';
import {Buffer} from 'buffer';

export enum OrderStatus {
  PendingPayment = 'wc-pending',
  Processing = 'wc-processing',
  OnHold = 'wc-on-hold',
  Completed = 'wc-completed',
  RefundRequested = 'wc-return-requested',
  RefundApproved = 'wc-return-approved',
  RefundCancelled = 'wc-return-cancelled',
  Cancelled = 'wc-cancelled',
  Refunded = 'wc-refunded',
  Failed = 'wc-failed',
  Draft = 'wc-checkout-draft',
}
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
  async updateOrderStatus(orderId: number, status: string) {
    try {
      const validStatuses = [
        'wc-pending',
        'wc-processing',
        'wc-on-hold',
        'wc-completed',
        'wc-cancelled',
        'refunded',
        'wc-failed',
      ];

      if (!validStatuses.includes(status)) {
        throw new Error(
          `Invalid status: ${status}. Valid statuses are: ${validStatuses.join(
            ', ',
          )}`,
        );
      }
      const endpoint = `${this.url}/wp-json/dokan/v2/orders/${orderId}`;
      console.log(
        `Updating order status at endpoint: ${endpoint} with status: ${status}`,
      );

      // Perform the POST request to update the order status
      const response = await axios.post(
        endpoint,
        {status},
        {
          headers: {
            ...this.headers,
            'Cache-Control': 'no-cache',
          },
        },
      );

      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.error(`Axios error: ${error.message}`);
        if (error.response) {
          console.error(
            `Response data: ${JSON.stringify(error.response.data)}`,
          );
          console.error(`Response status: ${error.response.status}`);
          console.error(
            `Response headers: ${JSON.stringify(error.response.headers)}`,
          );
        } else if (error.request) {
          console.error(`Request data: ${JSON.stringify(error.request)}`);
        }
      } else {
        console.error(`Error: ${error.message}`);
      }
      throw new Error(`Error while updating order status: ${error}`);
    }
  }
}
