export const formatLat = (lat: number) => `${Math.abs(lat).toFixed(2)}° ${lat < 0 ? 'S' : 'N'}`

export const formatLon = (lon: number) => `${Math.abs(lon).toFixed(2)}° ${lon < 0 ? 'W' : 'E'}`

export const formatKm = (km: number) => Math.round(km).toLocaleString('en-US')
