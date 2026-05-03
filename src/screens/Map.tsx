import React, { useState, useEffect } from 'react';
import { ChevronLeft, MapPin, Recycle, Battery, Droplets, Navigation, Search, Share2, Compass, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Screen } from '../types';

// Fix for Leaflet default icon issues in React
// @ts-ignore
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

type FacilityType = 'recycle' | 'ev' | 'water' | 'washroom';

interface Location {
  id: number;
  type: FacilityType;
  name: string;
  distance: string;
  status: 'Open' | 'Closed';
  lat: number;
  lng: number;
}

const INITIAL_POS: [number, number] = [51.505, -0.09]; // London as default

const locations: Location[] = [
  { id: 1, type: 'recycle', name: 'GreenHub Recycling', distance: '0.8 km', status: 'Open', lat: 51.51, lng: -0.1 },
  { id: 2, type: 'ev', name: 'SuperCharge Station', distance: '1.2 km', status: 'Open', lat: 51.505, lng: -0.08 },
  { id: 3, type: 'water', name: 'PureFlow Park Refill', distance: '0.4 km', status: 'Open', lat: 51.498, lng: -0.105 },
  { id: 4, type: 'washroom', name: 'Eco-Loo Public', distance: '0.6 km', status: 'Open', lat: 51.515, lng: -0.095 },
  { id: 5, type: 'recycle', name: 'Community Paper Bin', distance: '2.1 km', status: 'Open', lat: 51.502, lng: -0.115 },
];

interface MapProps {
  setScreen: (screen: Screen) => void;
}

const RecenterMap = ({ coords }: { coords: [number, number] }) => {
  const map = useMap();
  map.setView(coords, map.getZoom());
  return null;
};

export default function MapScreen({ setScreen }: MapProps) {
  const [selectedType, setSelectedType] = useState<FacilityType | 'all'>('all');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [userPos, setUserPos] = useState<[number, number]>(INITIAL_POS);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
        () => console.log('Location access denied')
      );
    }
  }, []);

  const filteredLocations = selectedType === 'all' 
    ? locations 
    : locations.filter(l => l.type === selectedType);

  const getIcon = (type: FacilityType, size = 20, color = "#fff") => {
    switch (type) {
      case 'recycle': return <Recycle size={size} color={color} />;
      case 'ev': return <Battery size={size} color={color} />;
      case 'water': return <Droplets size={size} color={color} />;
      case 'washroom': return <span className="font-black text-xs" style={{ color }}>WC</span>;
    }
  };

  const getColor = (type: FacilityType) => {
    switch (type) {
      case 'recycle': return '#5CB338';
      case 'ev': return '#F97316';
      case 'water': return '#3B82F6';
      case 'washroom': return '#8B5CF6';
    }
  };

  const createCustomIcon = (type: FacilityType) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${getColor(type)};
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        ">
          <div style="color: white">
            ${type === 'washroom' ? 'WC' : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${getPath(type)}"/></svg>`}
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });
  };

  const getPath = (type: FacilityType) => {
    switch(type) {
        case 'recycle': return 'M7 11V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6 M3 11h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z M11 15h2 M11 18h2';
        case 'ev': return 'M21 7h-3a2 2 0 0 1-2-2V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1 M16 8h4a2 2 0 0 1 2 2v3 M5 22h4 M15 22h4';
        case 'water': return 'm12 22 4-4H8l4 4Z M12 2v2 M12 8a4 4 0 0 0-4 4c0 3 4 8 4 8s4-5 4-8a4 4 0 0 0-4-4Z';
        default: return '';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F7FBF4] relative">
      {/* Search Header */}
      <header className="px-6 pt-12 pb-4 bg-white flex items-center gap-3 relative z-[1000] shadow-sm">
        <button 
          onClick={() => setScreen('dashboard')}
          className="p-3 bg-gray-50 rounded-2xl active:scale-90 transition-transform"
        >
          <ChevronLeft size={24} className="text-gray-400" />
        </button>
        <div className="flex-1 bg-gray-50 rounded-2xl flex items-center px-4 py-3 border border-gray-100 gap-3 group focus-within:border-[#5CB338]/30 transition-all">
          <Search size={18} className="text-gray-400" />
          <input 
            type="text"
            className="flex-1 bg-transparent text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400"
            placeholder="Search nearby eco-points..." 
          />
        </div>
      </header>

      {/* Categories Filter */}
      <div className="bg-white pb-4 z-[1000] shadow-sm">
        <div className="px-6 flex overflow-x-auto gap-2 no-scrollbar pb-1">
          {(['all', 'recycle', 'ev', 'water', 'washroom'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 ${
                selectedType === type ? 'bg-[#2F5233] text-white' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative z-0">
        <MapContainer 
          center={userPos} 
          zoom={13} 
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap coords={userPos} />
          
          {filteredLocations.map((loc) => (
            <Marker 
              key={loc.id} 
              position={[loc.lat, loc.lng]}
              icon={createCustomIcon(loc.type)}
              eventHandlers={{
                click: () => setSelectedLocation(loc),
              }}
            >
              <Popup className="custom-popup">
                <div className="p-1 font-sans">
                  <h4 className="font-black text-gray-900">{loc.name}</h4>
                  <p className="text-[10px] text-[#5CB338] font-bold">{loc.distance} away</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* User Location Marker */}
          <Marker position={userPos}>
              <Popup>You are here</Popup>
          </Marker>
        </MapContainer>

        {/* Floating Controls */}
        <div className="absolute right-6 top-6 flex flex-col gap-3 z-[1000]">
          <button className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform">
            <Compass size={24} className="text-gray-500" />
          </button>
          <button 
            onClick={() => setUserPos(INITIAL_POS)}
            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <MapPin size={24} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Info Panel / Card */}
      {selectedLocation && (
        <div className="absolute bottom-32 left-6 right-6 bg-white rounded-[2.5rem] p-6 shadow-2xl z-[1000] border border-gray-100 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div 
                className="p-4 rounded-2xl text-white shadow-lg"
                style={{ backgroundColor: getColor(selectedLocation.type) }}
              >
                {getIcon(selectedLocation.type, 24)}
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-gray-900">{selectedLocation.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-50 text-[10px] font-black text-[#5CB338] px-2 py-0.5 rounded-full uppercase">OPEN NOW</span>
                  <span className="text-[10px] font-bold text-gray-400">{selectedLocation.distance} away</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setSelectedLocation(null)}
              className="p-2 bg-gray-50 rounded-full text-gray-300 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="flex gap-3">
            <button className="flex-1 bg-[#5CB338] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#5CB338]/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
              <Navigation size={18} />
              DIRECT
            </button>
            <button className="flex-1 bg-gray-50 text-gray-600 font-black py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
              <Share2 size={18} />
              SHARE
            </button>
          </div>
        </div>
      )}

      {!selectedLocation && (
        <div className="bg-white pt-6 pb-12 px-6 rounded-t-[3rem] shadow-2xl relative z-[1000] border-t border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black text-gray-900 uppercase italic">Eco-Point Legend</h3>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Active Near You</span>
          </div>
          <div className="flex overflow-x-auto gap-3 no-scrollbar">
            {[
              { type: 'recycle', label: 'Recycling', color: '#10B981' },
              { type: 'ev', label: 'EV Power', color: '#F97316' },
              { type: 'water', label: 'Refill', color: '#3B82F6' },
              { type: 'washroom', label: 'Eco-Toilet', color: '#8B5CF6' },
            ].map(item => (
              <div key={item.type} className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-4 py-2 rounded-2xl shrink-0">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-wide">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
