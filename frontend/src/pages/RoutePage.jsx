import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import AppLayout from "../layouts/AppLayout";
import Loader from "../components/Loader";
import { getHospital, getHospitalRoute } from "../api/hospital";

const getHospitalCoordinates = (route) => {
  const hospitalLocation = route?.hospital?.location || {};
  const coordinates = hospitalLocation.coordinates;
  const lat = Number(route?.hospital_lat ?? coordinates?.[1] ?? route?.hospital?.lat ?? hospitalLocation.lat ?? route?.hospital?.latitude);
  const lng = Number(route?.hospital_lng ?? coordinates?.[0] ?? route?.hospital?.lng ?? hospitalLocation.lng ?? route?.hospital?.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
};

export default function RoutePage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (!navigator.geolocation) {
        toast.error("Geolocation is not supported by your browser");
        try {
          const res = await getHospital(id);
          setRoute({ hospital: res.data });
        } finally {
          setLoading(false);
        }
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await getHospitalRoute(id, latitude, longitude);
            setRoute(res.data);
          } finally {
            setLoading(false);
          }
        },
        async () => {
          toast.error("Could not get your location. Please allow location access.");
          try {
            const res = await getHospital(id);
            setRoute({ hospital: res.data });
          } finally {
            setLoading(false);
          }
        },
      );
    };
    load();
  }, [id]);

  if (loading) return <AppLayout><div className="mt-10 flex justify-center"><Loader /></div></AppLayout>;

  const hospitalLocation = route?.hospital?.location || {};
  const destination = getHospitalCoordinates(route);
  const lat = destination?.lat;
  const lng = destination?.lng;
  const mapUrl = destination
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02},${lat - 0.02},${lng + 0.02},${lat + 0.02}&layer=mapnik&marker=${lat},${lng}`
    : "";
  const mapsUrl =
    route?.google_maps_url ||
    (destination ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` : "");

  return (
    <AppLayout>
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold">{route?.hospital_name || route?.hospital?.name}</h2>
        <p className="text-blue-700">{route?.hospital_address || hospitalLocation.address}</p>
        <p className="mt-4 text-4xl font-bold text-blue-900">{route?.distance_km || 0} km</p>
        <p className="text-blue-700">Estimated travel time: {route?.travel_time_mins || route?.estimated_travel_mins || route?.estimated_travel_time || 0} mins</p>
        {mapsUrl ? (
          <a href={mapsUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2 text-white">Open in Google Maps</a>
        ) : (
          <button type="button" disabled className="mt-4 inline-block rounded-lg bg-slate-300 px-5 py-2 text-white">Coordinates unavailable</button>
        )}
      </div>
      {mapUrl && <iframe title="map" src={mapUrl} className="mt-6 h-[420px] w-full rounded-xl border-0 shadow-sm" />}
    </AppLayout>
  );
}

