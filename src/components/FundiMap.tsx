import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Fundi, LocationCoordinates } from '../types';
import { Crosshair, ZoomIn, ZoomOut, Maximize2, RefreshCw } from 'lucide-react';
import { formatDistance, estimateTravelTimeMinutes } from '../utils/distance';
import { formatCurrency } from '../utils/format';

// Fix Leaflet's default marker icon paths when bundled with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface FundiMapProps {
  userLocation: LocationCoordinates;
  radiusKm?: number;
  fundis: Fundi[];
  selectedFundi: Fundi | null;
  onSelectFundi: (fundi: Fundi) => void;
  onViewDetails: (fundi: Fundi) => void;
  onBookNow: (fundi: Fundi) => void;
  className?: string;
}

export const FundiMap: React.FC<FundiMapProps> = ({
  userLocation,
  radiusKm = 15,
  fundis,
  selectedFundi,
  onSelectFundi,
  onViewDetails,
  onBookNow,
  className,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  // Safe radius in km and meters
  const safeRadiusKm = typeof radiusKm === 'number' && !isNaN(radiusKm) && radiusKm > 0 ? radiusKm : 15;
  const safeRadiusMeters = safeRadiusKm * 1000;

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const lat = typeof userLocation.lat === 'number' && !isNaN(userLocation.lat) ? userLocation.lat : -1.2685;
    const lng = typeof userLocation.lng === 'number' && !isNaN(userLocation.lng) ? userLocation.lng : 36.8045;

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 13,
      zoomControl: false,
    });

    // Standard OpenStreetMap tiles with high availability
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;
    setMapLoaded(true);

    // Initial tile invalidation to guarantee full container rendering
    const timers = [
      setTimeout(() => map.invalidateSize(), 150),
      setTimeout(() => map.invalidateSize(), 500),
      setTimeout(() => map.invalidateSize(), 1200),
    ];

    // ResizeObserver ensures Leaflet updates automatically when window or layout changes
    let resizeObserver: ResizeObserver | null = null;
    if (mapContainerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      timers.forEach(clearTimeout);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      map.remove();
      mapInstanceRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  // Update center, user marker & radius circle when userLocation or radiusKm changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const lat = typeof userLocation.lat === 'number' && !isNaN(userLocation.lat) ? userLocation.lat : -1.2685;
    const lng = typeof userLocation.lng === 'number' && !isNaN(userLocation.lng) ? userLocation.lng : 36.8045;

    // Pan map to new user center
    map.setView([lat, lng], map.getZoom(), { animate: true });

    // User pin marker icon
    const userPinHtml = `
      <div class="relative flex items-center justify-center pointer-events-none">
        <div class="w-8 h-8 rounded-full bg-orange-600/30 animate-ping absolute"></div>
        <div class="w-7 h-7 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-lg border-2 border-white font-bold text-xs">
          📍
        </div>
      </div>
    `;

    const userIcon = L.divIcon({
      html: userPinHtml,
      className: 'custom-user-marker',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const popupHtml = `
      <div class="p-2 text-center">
        <strong class="text-sm font-bold text-slate-900 block">Your Location</strong>
        <span class="text-xs font-medium text-slate-700 block">${userLocation.neighborhood || userLocation.address || 'Nairobi'}</span>
        <span class="text-[11px] text-slate-500 tabular-nums block">${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
        <div class="mt-1 text-[11px] font-bold text-orange-600">${safeRadiusKm} km search radius</div>
      </div>
    `;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([lat, lng]);
      userMarkerRef.current.setPopupContent(popupHtml);
    } else {
      userMarkerRef.current = L.marker([lat, lng], { icon: userIcon })
        .addTo(map)
        .bindPopup(popupHtml);
    }

    // Radius circle
    if (userCircleRef.current) {
      userCircleRef.current.setLatLng([lat, lng]);
      userCircleRef.current.setRadius(safeRadiusMeters);
    } else {
      userCircleRef.current = L.circle([lat, lng], {
        radius: safeRadiusMeters,
        color: '#ea580c',
        weight: 1.5,
        opacity: 0.8,
        fillColor: '#f97316',
        fillOpacity: 0.08,
      }).addTo(map);
    }
  }, [userLocation.lat, userLocation.lng, userLocation.neighborhood, userLocation.address, safeRadiusKm, safeRadiusMeters]);

  // Update Fundis Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    fundis.forEach((fundi) => {
      if (!fundi.location || typeof fundi.location.lat !== 'number' || typeof fundi.location.lng !== 'number') {
        return;
      }

      const isSelected = selectedFundi?.id === fundi.id;
      const matchScore = fundi.matchScore ?? 90;
      const distance = fundi.distanceKm ?? 0;
      const travelTime = estimateTravelTimeMinutes(distance);

      // Distinct category color coding
      let badgeColor = 'bg-orange-600';
      if (fundi.primaryCategory === 'Plumbing') badgeColor = 'bg-blue-600';
      if (fundi.primaryCategory === 'Electrical') badgeColor = 'bg-amber-600';
      if (fundi.primaryCategory === 'Carpentry') badgeColor = 'bg-amber-800';
      if (fundi.primaryCategory === 'Painting') badgeColor = 'bg-emerald-600';
      if (fundi.primaryCategory === 'Appliance Repair') badgeColor = 'bg-purple-600';

      const markerHtml = `
        <div class="relative group cursor-pointer transition-transform duration-200 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'}">
          <div class="flex items-center gap-1 px-2 py-1 rounded-full text-white ${badgeColor} shadow-md border-2 ${isSelected ? 'border-amber-400 ring-4 ring-orange-500/30' : 'border-white'} font-bold text-[11px] whitespace-nowrap">
            <span>${fundi.rating}★</span>
            <span class="opacity-80 text-[10px]">${matchScore}%</span>
          </div>
          <div class="w-2 h-2 ${badgeColor} rotate-45 mx-auto -mt-1 shadow-sm"></div>
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: 'custom-fundi-marker',
        iconSize: [60, 30],
        iconAnchor: [30, 30],
      });

      const marker = L.marker([fundi.location.lat, fundi.location.lng], { icon })
        .addTo(markersLayer);

      // Popup Content
      const popupContent = `
        <div class="p-2.5 max-w-[240px] font-sans">
          <div class="flex items-center gap-2 mb-1.5">
            <img src="${fundi.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}" class="w-10 h-10 rounded-xl object-cover border border-slate-200" />
            <div>
              <div class="font-bold text-xs text-slate-900 leading-tight">${fundi.name}</div>
              <div class="text-[11px] font-semibold text-orange-600">${fundi.primaryCategory}</div>
            </div>
          </div>
          <div class="flex items-center justify-between text-[11px] py-1 border-t border-slate-100 text-slate-600">
            <span>📍 ${formatDistance(distance)} (~${travelTime}m)</span>
            <span class="font-bold text-emerald-600">${matchScore}% Match</span>
          </div>
          <div class="text-xs font-bold text-slate-900 mt-1 mb-2">
            KES ${formatCurrency(fundi.hourlyRateKes)}<span class="font-normal text-slate-500">/hr</span>
          </div>
          <div class="grid grid-cols-2 gap-1.5">
            <button id="map-popup-detail-${fundi.id}" class="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold text-center">
              Profile
            </button>
            <button id="map-popup-book-${fundi.id}" class="px-2 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-bold text-center shadow-xs">
              Book
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { minWidth: 220, closeButton: false });

      marker.on('click', () => {
        onSelectFundi(fundi);
      });

      marker.on('popupopen', () => {
        setTimeout(() => {
          const detailBtn = document.getElementById(`map-popup-detail-${fundi.id}`);
          const bookBtn = document.getElementById(`map-popup-book-${fundi.id}`);
          if (detailBtn) {
            detailBtn.onclick = () => onViewDetails(fundi);
          }
          if (bookBtn) {
            bookBtn.onclick = () => onBookNow(fundi);
          }
        }, 50);
      });
    });
  }, [fundis, selectedFundi?.id]);

  // Update Route Polyline between user and selected fundi
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    if (selectedFundi && selectedFundi.location && typeof selectedFundi.location.lat === 'number') {
      const line = L.polyline(
        [
          [userLocation.lat, userLocation.lng],
          [selectedFundi.location.lat, selectedFundi.location.lng],
        ],
        {
          color: '#ea580c',
          weight: 3,
          dashArray: '6, 8',
          opacity: 0.8,
        }
      ).addTo(map);

      routeLineRef.current = line;
      map.panTo([selectedFundi.location.lat, selectedFundi.location.lng], { animate: true });
    }
  }, [selectedFundi?.id, userLocation.lat, userLocation.lng]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 13, { animate: true });
    }
  };

  const handleFitAllFundis = () => {
    if (!mapInstanceRef.current) return;
    const points: [number, number][] = [[userLocation.lat, userLocation.lng]];
    fundis.forEach(f => {
      if (f.location?.lat && f.location?.lng) {
        points.push([f.location.lat, f.location.lng]);
      }
    });
    if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  return (
    <div className={className || "relative w-full h-[460px] md:h-[520px] min-h-[420px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100"}>
      
      {/* Map Target DOM: using absolute inset-0 guarantees full width & height */}
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0 z-0 bg-slate-100" />

      {/* Floating Map Controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 shadow-md rounded-xl overflow-hidden bg-white/95 backdrop-blur-xs border border-slate-200/80 p-1">
        <button
          onClick={handleRecenter}
          className="p-2 hover:bg-slate-100 text-slate-700 rounded-lg transition"
          title="Recenter on My Location"
        >
          <Crosshair className="w-4 h-4 text-orange-600" />
        </button>
        <button
          onClick={handleFitAllFundis}
          className="p-2 hover:bg-slate-100 text-slate-700 rounded-lg transition"
          title="Fit all nearby fundis in view"
        >
          <Maximize2 className="w-4 h-4 text-slate-600" />
        </button>
        <div className="w-full h-px bg-slate-200"></div>
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-slate-100 text-slate-700 rounded-lg transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-slate-100 text-slate-700 rounded-lg transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* Map Top Badge: Quick Status */}
      <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-sm text-xs font-semibold text-slate-800 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>{fundis.length} Fundis on Live Map</span>
        <span className="text-[11px] text-slate-400 font-normal">({safeRadiusKm}km)</span>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-xs px-3 py-2 rounded-xl border border-slate-200 shadow-md text-[11px] font-medium text-slate-700 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-600 ring-2 ring-orange-200"></span>
          <span>You</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
          <span>Plumbing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
          <span>Electrical</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
          <span>Appliance</span>
        </div>
      </div>

    </div>
  );
};
