/**
 * Geolocation & Reverse Geocoding Utility
 * Identifies current location coordinates and converts to physical street address.
 */

import { api } from '../lib/api.js';

export interface GeolocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  address: string;
}

export async function getCurrentPositionCoordinates(): Promise<{ latitude: number; longitude: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      error => {
        let msg = 'Unable to retrieve location';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location access permission was denied. Please allow location access in your browser.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location position is currently unavailable.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  });
}

/**
 * Reverse geocodes latitude/longitude to a physical address using OpenStreetMap / Nominatim API
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=en`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      return `Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`;
    }

    const data = await res.json();
    if (data && data.display_name) {
      // Build a clean, formatted banking address
      const addr = data.address || {};
      const parts: string[] = [];

      if (addr.building || addr.amenity || addr.office) parts.push(addr.building || addr.amenity || addr.office);
      if (addr.road || addr.street) parts.push(addr.road || addr.street);
      if (addr.suburb || addr.neighbourhood || addr.residential) parts.push(addr.suburb || addr.neighbourhood || addr.residential);
      if (addr.city || addr.town || addr.municipality) parts.push(addr.city || addr.town || addr.municipality);
      if (addr.postcode) parts.push(`Postal ${addr.postcode}`);
      if (addr.state || addr.district) parts.push(addr.state || addr.district);

      if (parts.length > 0) {
        return parts.join(', ');
      }
      return data.display_name;
    }
  } catch (err) {
    console.warn('Reverse geocoding lookup fallback:', err);
  }

  return `Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`;
}

/**
 * Gets current location and auto-identifies address, then pings server so Mentor can monitor
 */
export async function identifyCurrentLocationAndPing(actionContext = 'Address Identification'): Promise<GeolocationResult> {
  const coords = await getCurrentPositionCoordinates();
  const address = await reverseGeocode(coords.latitude, coords.longitude);

  // Send background ping to server for Mentor monitoring
  try {
    await api.recordLocationPing({
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      address,
      actionContext,
    });
  } catch (err) {
    console.warn('Location ping logging error:', err);
  }

  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy,
    address,
  };
}
