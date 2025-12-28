const axios = require("axios");
const { getWeatherData } = require("../services/weatherService");

// Mock axios to avoid real API calls
jest.mock("axios");

describe("Weather Service Unit Tests (Mocked)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getWeatherData - Success Cases", () => {
    it("should return geolocation data for valid ZIP code", async () => {
      const mockResponse = {
        data: {
          coord: { lat: 40.7128, lon: -74.006 },
          timezone: -18000,
          name: "New York"
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await getWeatherData("10001");

      expect(result).toEqual({
        lat: 40.7128,
        lon: -74.006,
        timezone: -18000,
        locationName: "New York"
      });

      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: {
            zip: "10001,us",
            appid: expect.any(String)
          },
          timeout: 5000
        })
      );
    });

    it("should handle different US ZIP codes correctly", async () => {
      const mockResponse = {
        data: {
          coord: { lat: 34.0522, lon: -118.2437 },
          timezone: -28800,
          name: "Los Angeles"
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await getWeatherData("90001");

      expect(result.lat).toBe(34.0522);
      expect(result.lon).toBe(-118.2437);
      expect(result.locationName).toBe("Los Angeles");
    });
  });

  describe("getWeatherData - Input Validation", () => {
    it("should throw error for invalid ZIP format (too short)", async () => {
      await expect(getWeatherData("123")).rejects.toThrow("Invalid ZIP code format");
      expect(axios.get).not.toHaveBeenCalled();
    });

    it("should throw error for invalid ZIP format (too long)", async () => {
      await expect(getWeatherData("123456")).rejects.toThrow("Invalid ZIP code format");
      expect(axios.get).not.toHaveBeenCalled();
    });

    it("should throw error for non-numeric ZIP", async () => {
      await expect(getWeatherData("ABCDE")).rejects.toThrow("Invalid ZIP code format");
      expect(axios.get).not.toHaveBeenCalled();
    });

    it("should throw error for ZIP with special characters", async () => {
      await expect(getWeatherData("12-34")).rejects.toThrow("Invalid ZIP code format");
      expect(axios.get).not.toHaveBeenCalled();
    });
  });

  describe("getWeatherData - API Error Handling", () => {
    it("should handle 404 error for non-existent ZIP code", async () => {
      const error = new Error("Not found");
      error.response = { status: 404 };

      axios.get.mockRejectedValue(error);

      await expect(getWeatherData("00000")).rejects.toThrow("ZIP code 00000 not found");
    });

    it("should handle 401 error for invalid API key", async () => {
      const error = new Error("Unauthorized");
      error.response = { status: 401 };

      axios.get.mockRejectedValue(error);

      await expect(getWeatherData("10001")).rejects.toThrow("Weather API Key is invalid");
    });

    it("should handle 429 error for rate limit exceeded", async () => {
      const error = new Error("Too many requests");
      error.response = { status: 429 };

      axios.get.mockRejectedValue(error);

      await expect(getWeatherData("10001")).rejects.toThrow("Weather API rate limit exceeded");
    });

    it("should handle network errors", async () => {
      const error = new Error("Network error");
      error.request = {}; // Request was made but no response

      axios.get.mockRejectedValue(error);

      await expect(getWeatherData("10001")).rejects.toThrow(
        "Weather service is currently unreachable"
      );
    });

    it("should handle unexpected errors", async () => {
      const error = new Error("Unknown error");

      axios.get.mockRejectedValue(error);

      await expect(getWeatherData("10001")).rejects.toThrow(
        "An internal error occurred while fetching location data"
      );
    });
  });

  describe("Response Data Structure", () => {
    it("should return all required fields", async () => {
      const mockResponse = {
        data: {
          coord: { lat: 37.7749, lon: -122.4194 },
          timezone: -28800,
          name: "San Francisco"
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await getWeatherData("94102");

      expect(result).toHaveProperty("lat");
      expect(result).toHaveProperty("lon");
      expect(result).toHaveProperty("timezone");
      expect(result).toHaveProperty("locationName");
    });

    it("should convert API response format correctly", async () => {
      const mockResponse = {
        data: {
          coord: { lat: 41.8781, lon: -87.6298 },
          timezone: -21600,
          name: "Chicago"
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await getWeatherData("60601");

      // Verify mapping from coord.lat/lon to lat/lon
      expect(result.lat).toBe(41.8781);
      expect(result.lon).toBe(-87.6298);

      // Verify mapping from name to locationName
      expect(result.locationName).toBe("Chicago");

      // Verify timezone is passed through
      expect(result.timezone).toBe(-21600);
    });
  });
});
