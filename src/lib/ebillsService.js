// lib/ebillsService.js
// eBills API service for VTU operations

const AUTH_URL = "https://ebills.africa/wp-json/jwt-auth/v1/token";
const API_URL = "https://ebills.africa/wp-json/api/v2/";

class EBillsService {
  constructor() {
    this.token = null;
    this.username = process.env.EBILLS_USERNAME;
    this.password = process.env.EBILLS_PASSWORD;
  }

  // Get authentication token from eBills
  async getAccessToken() {
    try {
      const payload = {
        username: this.username,
        password: this.password,
      };

      const response = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.token) {
        this.token = data.token;
        return this.token;
      }

      throw new Error(data.message || "Authentication failed");
    } catch (error) {
      console.error("eBills auth error:", error);
      throw error;
    }
  }

  // Get headers with auth token
  getHeaders() {
    if (!this.token) {
      throw new Error("Token not initialized. Call getAccessToken first.");
    }
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };
  }

  // Check eBills wallet balance
  async checkBalance() {
    try {
      const response = await fetch(`${API_URL}balance`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error checking balance: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Balance check error:", error);
      throw error;
    }
  }

  // Purchase airtime
  async purchaseAirtime(phone, serviceId, amount, requestId) {
    try {
      const payload = {
        request_id: requestId,
        phone: phone,
        service_id: serviceId,
        amount: amount,
      };

      const response = await fetch(`${API_URL}airtime`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Airtime purchase failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Airtime purchase error:", error);
      throw error;
    }
  }

  // Purchase data bundle
  async purchaseData(phone, serviceId, variationId, requestId) {
    try {
      const payload = {
        request_id: requestId,
        phone: phone,
        service_id: serviceId,
        variation_id: variationId,
      };

      const response = await fetch(`${API_URL}data`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Data purchase failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Data purchase error:", error);
      throw error;
    }
  }

  // Purchase TV subscription
  async purchaseTvSubscription(customerId, serviceId, variationId, requestId) {
    try {
      const payload = {
        request_id: requestId,
        customer_id: customerId,
        service_id: serviceId,
        variation_id: variationId,
      };

      const response = await fetch(`${API_URL}tv`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`TV subscription failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("TV subscription error:", error);
      throw error;
    }
  }

  // Get data variations for a service
  async getDataVariations(serviceId = null) {
    try {
      let url = `${API_URL}variations/data`;
      if (serviceId) url += `?service_id=${serviceId}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error getting data variations: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Data variations error:", error);
      throw error;
    }
  }

  // Get TV variations for a service
  async getTvVariations(serviceId = null) {
    try {
      let url = `${API_URL}variations/tv`;
      if (serviceId) url += `?service_id=${serviceId}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error getting TV variations: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("TV variations error:", error);
      throw error;
    }
  }

  // Verify customer for TV/Electricity services
  async verifyCustomer(serviceId, customerId, variationId = null) {
    try {
      const payload = {
        customer_id: customerId,
        service_id: serviceId,
      };
      if (variationId) payload.variation_id = variationId;

      const response = await fetch(`${API_URL}verify-customer`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Customer verification failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Customer verification error:", error);
      throw error;
    }
  }

  // Requery transaction status
  async requeryTransaction(requestId) {
    try {
      const payload = { request_id: requestId };

      const response = await fetch(`${API_URL}requery`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Requery failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Requery error:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const ebillsService = new EBillsService();
