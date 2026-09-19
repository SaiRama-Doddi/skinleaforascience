// Service for HTML5 Geolocation and Reverse Geocoding

export const detectLiveLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Primary reverse geocode API: BigDataCloud (Free client-side reverse geocoding API)
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const data = await res.json();

          let city = data.city || data.locality || data.localityInfo?.administrative?.[2]?.name || '';
          let state = data.principalSubdivision || data.localityInfo?.administrative?.[1]?.name || '';
          let pincode = data.postcode || '';
          let addressLine = [
            data.locality,
            data.city,
            data.principalSubdivision
          ].filter(Boolean).join(', ');

          // Backup reverse geocode API: Nominatim OpenStreetMap if details are missing
          if (!pincode || !addressLine) {
            try {
              const nomRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
              const nomData = await nomRes.json();
              if (nomData && nomData.address) {
                const addr = nomData.address;
                pincode = pincode || addr.postcode || '';
                city = city || addr.city || addr.town || addr.village || addr.suburb || '';
                state = state || addr.state || '';
                const roadParts = [addr.road, addr.suburb, addr.neighbourhood, addr.city_district].filter(Boolean);
                if (roadParts.length > 0) {
                  addressLine = roadParts.join(', ');
                }
              }
            } catch (e) {}
          }

          resolve({
            latitude,
            longitude,
            address_line1: addressLine || `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
            city,
            state,
            pincode
          });
        } catch (err) {
          reject(new Error('Failed to retrieve address details for your live location.'));
        }
      },
      (error) => {
        let msg = 'Could not access live location.';
        if (error.code === error.PERMISSION_DENIED) msg = 'Location permission denied. Please enable location permissions in your browser settings.';
        else if (error.code === error.POSITION_UNAVAILABLE) msg = 'Live location information is unavailable.';
        else if (error.code === error.TIMEOUT) msg = 'Live location request timed out.';
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  });
};
